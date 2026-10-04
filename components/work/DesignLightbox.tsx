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
  const { items, activeIndex, close, next } = useDesignLightbox();

  // js/app.js:158 — a non-null activeDesignIndex *is* "open". Everything the
  // source did imperatively on open/close (remove 'hidden', set
  // // aria-hidden, js/app.js:174-189) is a pure function of this value.
  const isOpen = activeIndex !== null;
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
  // app/globals.css:122). Keyed on activeIndex so open/close/navigate all
  // converge on the right state; the cleanup also covers unmount, so leaving
  // the page never strands the page at overflow: hidden.
  useEffect(() => {
    if (activeIndex !== null) {
      document.body.classList.add('lightbox-open');
    } else {
      document.body.classList.remove('lightbox-open');
    }
    return () => document.body.classList.remove('lightbox-open');
  }, [activeIndex]);

  // js/app.js:215-221 — the document-level keydown listener. The source
  // guards with `if (lightbox.classList.contains('hidden')) return;` so keys
  // are inert while the shell is hidden; the equivalent guard here is
  // `activeIndex === null`, checked against the same render's state (the
  // listener is re-registered whenever activeIndex changes, so the closure
  // never holds a stale index).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeIndex === null) return;

      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') next(-1);
      if (event.key === 'ArrowRight') next(1);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, close, next]);

  // js/app.js:223-258 — swipe on the stage. The stage element exists for the
  // component's whole lifetime (it is only hidden, never unmounted), so this
  // attaches once per `next` identity — `next` changes when items.length
  // changes, which is exactly when a stale closure would wrap wrongly.
  const stageRef = useRef<HTMLDivElement>(null);

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
                {/* js/app.js:167-168 sets src/alt imperatively. The source
                    ships <img src="" alt=""> and fills it on open; React warns
                    on an empty src, so the img renders only once a work is
                    active — which is also the only moment the shell is
                    visible, so there is no visual difference. */}
                {work ? (
                  <img
                    id="lightbox-image"
                    src={optimizedImage}
                    alt={`${work.title} design preview`}
                    className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain sm:max-h-[76vh]"
                  />
                ) : null}
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
