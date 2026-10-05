'use client';

import { useEffect, useRef } from 'react';
import { getDesignMetaText, useDesignLightbox } from '@/lib/designLightbox';
import { optimizeCloudinaryImage } from '@/lib/cloudinary';

// js/app.js:196-261 setupDesignLightbox + index.html:714-767 — the lightbox
// shell, transcribed verbatim: every class string, id, type and aria-label is
// the source's. The source keeps one shell in the DOM at all times and only
// toggles `hidden`/`aria-hidden` (js/app.js:174-189), so this component always
// renders the full tree and derives visibility from the provider's index.
//
// All state lives in DesignLightboxProvider (Task 10); this file holds none of
// its own. Content that the source writes imperatively in
// updateLightboxContent (js/app.js:156-172) is derived here from
// items[activeIndex] instead — no getElementById anywhere.
export default function DesignLightbox() {
  const { items, activeIndex, isOpen, close, next } = useDesignLightbox();

  // js/app.js:175-181 / :186-188 — the shell's `hidden` class and aria-hidden
  // are the source's open/close half, which closeDesignLightbox never couples
  // to the caption: `activeDesignIndex` survives a close, so #lightbox-title,
  // #lightbox-meta, #lightbox-counter and the #lightbox-image src/alt keep the
  // last item's values while the shell is hidden. Hence visibility comes from
  // `isOpen` and content from `activeIndex`, two separate values.
  // `activeIndex === null` is the pre-first-open state, which is the one that
  // has to match index.html:733's empty caption and src-less <img>.
  const work = activeIndex === null ? null : items[activeIndex];

  // The source's class attribute is the base list with `hidden` in position;
  // classList.remove('hidden') leaves the rest untouched. Building the list
  // the same way keeps the closed string byte-identical to index.html:715 and
  // the open string byte-identical to the post-open DOM (single spaces, no
  // gap where `hidden` was).
  const shellClass = [
    'fixed inset-0 z-[100]',
    ...(isOpen ? [] : ['hidden']),
    'bg-black/90 backdrop-blur-sm p-3 sm:p-6',
  ].join(' ');

  // js/app.js:161-165 — 1600x2000 c_limit transform, falling back to the raw
  // URL exactly as `optimizeCloudinaryImage(...) || activeWork.image_url`
  // does (non-Cloudinary paths and the empty string pass through unchanged).
  const optimizedImage = work
    ? optimizeCloudinaryImage(work.image_url, {
        width: 1600,
        height: 2000,
        crop: 'limit',
      }) || work.image_url
    : '';

  // js/app.js:180 / 188 — body.lightbox-open ({ overflow: hidden } in
  // app/globals.css:122). Keyed on isOpen so open and close both land on the
  // right state; the cleanup also covers unmount, so leaving the page never
  // strands the page at overflow: hidden.
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('lightbox-open');
    } else {
      document.body.classList.remove('lightbox-open');
    }
    return () => document.body.classList.remove('lightbox-open');
  }, [isOpen]);

  // js/app.js:215-221 — the document-level keydown listener. The source
  // guards with `if (lightbox.classList.contains('hidden')) return;` so keys
  // are inert while the shell is hidden; the equivalent guard here is `!isOpen`,
  // checked against the same render's state (the listener is re-registered
  // whenever isOpen changes, so the closure never reads a stale flag). It reads
  // isOpen rather than activeIndex because a closed shell still has an index.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') next(-1);
      if (event.key === 'ArrowRight') next(1);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close, next]);

  // js/app.js:223-258 — swipe on the stage. The stage element exists for the
  // component's whole lifetime (it is only hidden, never unmounted), so this
  // attaches once per `next` identity — `next` changes when items.length
  // changes, which is exactly when a stale closure would wrap wrongly.
  const stageRef = useRef<HTMLDivElement>(null);

  // js/app.js:206 + :260 — setupDesignLightbox returns early if the shell is
  // already data-ready, then stamps data-ready="true" on it once the listeners
  // are attached. Nothing here reads the marker (React's effects attach and
  // detach themselves, so the idempotency guard has no job), but it is part of
  // the source's live DOM after setup runs, so it is reproduced verbatim rather
  // than left as a difference. Set in an effect, so the server-rendered HTML
  // matches the source's pre-setup HTML exactly.
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    shell.dataset.ready = 'true';
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchActive = false;

    const onTouchStart = (event: TouchEvent) => {
      // js/app.js:228 — only a single-finger swipe starts a gesture.
      if (event.touches.length !== 1) return;
      touchActive = true;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    };

    const onTouchEnd = (event: TouchEvent) => {
      // js/app.js:235 — a gesture that never started, or ended in multiple
      // touches, is ignored rather than treated as a swipe.
      if (!touchActive || event.changedTouches.length !== 1) return;

      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;
      const horizontalDistance = Math.abs(deltaX);
      const verticalDistance = Math.abs(deltaY);
      const swipeThreshold = 48;

      touchActive = false;

      // js/app.js:245 — below the 48px threshold, or more vertical than
      // horizontal, so the browser keeps the scroll/zoom.
      if (
        horizontalDistance < swipeThreshold ||
        horizontalDistance <= verticalDistance
      ) {
        return;
      }

      // js/app.js:249-253 — swiping left advances, swiping right goes back.
      if (deltaX < 0) {
        next(1);
      } else {
        next(-1);
      }
    };

    const onTouchCancel = () => {
      // js/app.js:256-258 — a cancelled gesture must not leave touchActive
      // latched, or the next touchend would read stale start coordinates.
      touchActive = false;
    };

    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchend', onTouchEnd, { passive: true });
    stage.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [next]);

  return (
    <div
      id="design-lightbox"
      ref={shellRef}
      className={shellClass}
      aria-hidden={isOpen ? 'false' : 'true'}
    >
      <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-center">
        <button
          id="lightbox-backdrop-close"
          className="absolute inset-0 cursor-default"
          aria-label="Close image preview"
          // js/app.js:209 — the full-bleed backdrop button closes; the caption
          // block sits above it (z-10), so only genuine backdrop clicks land here.
          onClick={close}
        />
        <div className="relative z-10 flex h-full w-full flex-col justify-center">
          <div className="absolute right-0 top-0 flex items-center gap-2 p-1 sm:p-0">
            <button
              id="lightbox-close"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              type="button"
              aria-label="Close preview"
              onClick={close}
            >
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center gap-2 sm:gap-4">
            <button
              id="lightbox-prev"
              className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              type="button"
              aria-label="Previous image"
              onClick={() => next(-1)}
            >
              <span className="material-icons-outlined">chevron_left</span>
            </button>
            <div className="flex min-h-0 w-full max-w-5xl flex-col items-center">
              <div
                id="lightbox-stage"
                ref={stageRef}
                className="flex min-h-0 w-full touch-pan-y items-center justify-center overflow-hidden rounded-3xl bg-white/5 p-2 sm:p-4"
              >
                {/* index.html:733 ships <img id="lightbox-image" src="" alt=""
                    class="..."> and js/app.js:167-168 fills src/alt on open.
                    The element belongs to the shell for the shell's whole
                    lifetime, so it is always rendered: react-dom/server 19.3
                    drops an empty-string `src` outright (verified — no JSX
                    spelling of src="" reaches the markup), so while closed the
                    attribute is absent rather than empty. `img.src` reads ''
                    either way, and no other attribute, class or id differs. */}
                <img
                  id="lightbox-image"
                  src={work ? optimizedImage : undefined}
                  alt={work ? `${work.title} design preview` : ''}
                  className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain sm:max-h-[76vh]"
                />
              </div>
              <div className="mt-4 flex w-full flex-col gap-3 px-1 text-white sm:mt-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h3
                    id="lightbox-title"
                    className="truncate text-xl font-semibold sm:text-2xl"
                  >
                    {work ? work.title : null}
                  </h3>
                  <p
                    id="lightbox-meta"
                    className="mt-1 text-sm text-white/70 sm:text-base"
                  >
                    {/* js/app.js:170 — getDesignMetaText, imported from the
                        provider module rather than re-implemented. */}
                    {work ? getDesignMetaText(work) : null}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span id="lightbox-counter" className="text-sm text-white/60">
                    {/* js/app.js:171 — `${activeDesignIndex + 1} / ${designWorks.length}` */}
                    {activeIndex === null
                      ? null
                      : `${activeIndex + 1} / ${items.length}`}
                  </span>
                  <div className="flex gap-2 sm:hidden">
                    <button
                      id="lightbox-prev-mobile"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                      type="button"
                      aria-label="Previous image"
                      onClick={() => next(-1)}
                    >
                      <span className="material-icons-outlined">chevron_left</span>
                    </button>
                    <button
                      id="lightbox-next-mobile"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                      type="button"
                      aria-label="Next image"
                      onClick={() => next(1)}
                    >
                      <span className="material-icons-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              id="lightbox-next"
              className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              type="button"
              aria-label="Next image"
              onClick={() => next(1)}
            >
              <span className="material-icons-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
