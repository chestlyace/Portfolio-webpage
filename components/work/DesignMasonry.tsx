'use client';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import { useDesignLightbox } from '@/lib/designLightbox';

// js/app.js:418-439 — the `design` branch of renderWorks, transcribed from
// the source template literal. The tiles are the only DOM this file adds:
// the `.masonry-gallery` wrapper already lives in Work.tsx (Task 8) and the
// layout is the CSS `column-count` in app/globals.css — no JS masonry.
//
// The overlay's two whitespace-only text nodes (between the title <span>
// and the meta <div>, and between the two meta spans) are reproduced with
// {' '} below: the source template's newline+indent parses to whitespace
// that generates no box in the flex/flex-wrap containers, but dropping it
// makes normalised textContent join the words together.
export default function DesignMasonry() {
  const { items, open } = useDesignLightbox();

  return (
    <>
      {items.map((work, index) => {
        // js/app.js:378-381 — design works take the 900x900 branch of the
        // ternary (projects take 1200 wide, Task 9). `items` IS
        // designWorks, so this map index equals the source's
        // `designWorks.findIndex(item => item.id === work.id)`.
        const optimizedWorkImage = optimizeCloudinaryImage(work.image_url, {
          width: 900,
          height: 900,
          crop: 'limit',
        });

        return (
          <article
            key={work.id}
            className="masonry-item group relative overflow-hidden rounded-2xl cursor-pointer bg-gray-100 dark:bg-white/5"
            role="button"
            tabIndex={0}
            aria-label={`Open ${work.title} preview`}
            data-design-index={index}
            // js/app.js:468-469 — click opens the lightbox at this tile's
            // designWorks index.
            onClick={() => open(index)}
            // js/app.js:470-475 — keyboard activation for role="button";
            // preventDefault() stops the page scrolling on Space. The source
            // does not check whether the lightbox is already open, so this
            // does not either.
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open(index);
              }
            }}
          >
            <img
              src={optimizedWorkImage}
              alt={`${work.title} design preview`}
              loading="lazy"
              decoding="async"
              className="block w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
              <span className="text-white font-display text-xl tracking-wider border-b-2 border-white pb-1">
                {work.title}
              </span>
              {' '}
              {work.design_tool || work.client_name ? (
                <div className="mt-2 flex flex-wrap gap-2 justify-center">
                  {work.design_tool ? (
                    <span className="text-[10px] uppercase font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                      {work.design_tool}
                    </span>
                  ) : null}
                  {work.design_tool && work.client_name ? ' ' : null}
                  {work.client_name ? (
                    <span className="text-[10px] uppercase font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                      {work.client_name}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </>
  );
}
