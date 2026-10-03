'use client';

import { Fragment } from 'react';
import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import type { Work } from '@/lib/types';

// js/app.js:440-465 — the `event` branch of renderWorks, transcribed from
// the source template literal. `card-hover` (on the article) and
// `dark:border-glass-border` are intentionally undefined no-op classes; they
// apply nothing and stay because they are part of today's DOM. `card-dark` is
// a real colour (#171717); `glass-border` is not a defined colour.
//
// The nullable fields are interpolated with template literals rather than as
// bare children: a template literal renders `null` as the text "null"
// (js/app.js:449, :454, :455), whereas React drops a null child entirely.
//
// The event branch reads only `highlights`, `title`, `description`,
// `category_label`, `source_url` and `image_url`. It has no `design_tool` or
// `client_name` — those belong to the design branch (js/app.js:418-439).
export default function EventCard({ work }: { work: Work }) {
  // js/app.js:378-381 computes this with a ternary,
  // `work.type === 'design' ? 900 : 1200` wide (height is `? 900 : 900`).
  // EventCard only ever receives `type === 'event'`, so the 900-wide design
  // branch is unreachable here — it belongs to the design gallery's card
  // (Task 10). Writing the resolved 1200x900 out is byte-identical output.
  // The source's `|| work.image_url` fallback is not copied because
  // optimizeCloudinaryImage already returns the input unchanged for URLs
  // without `/image/upload/` (and for a falsy input), so the fallback is a
  // no-op for every value image_url can take.
  const optimizedWorkImage = optimizeCloudinaryImage(work.image_url, {
    width: 1200,
    height: 900,
    crop: 'limit',
  });

  return (
    <article className="card-hover group relative bg-white dark:bg-card-dark border border-gray-200 dark:border-glass-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gray-300/20 dark:hover:shadow-white/5 transition-all duration-300 flex flex-col h-full">
      <div className="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          alt={`${work.title} event gallery cover`}
          loading="lazy"
          decoding="async"
          className="thumbnail w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          // js/app.js:448 interpolates this into an innerHTML template, so a
          // null image_url serialises as `src="null"`; a bare `src={x}` would
          // drop the attribute instead. The template keeps the source's bytes.
          src={`${optimizedWorkImage}`}
        />
        <div className="absolute top-4 right-4 bg-black/70 dark:bg-white/90 text-white dark:text-black text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm uppercase tracking-wider">
          {`${work.category_label}`}
        </div>
      </div>
      <div className="p-6 md:p-8 flex flex-col flex-grow">
        {/* js/app.js:452 is a pointless `justify-between` wrapper around a
            single <div>, but it is in today's DOM, so it stays. */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold font-body text-gray-900 dark:text-white mb-2">
              {`${work.title}`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
              {`${work.description}`}
            </p>
          </div>
        </div>
        {/* js/app.js:441-443 joins template literals that each carry a
            newline + indent on both sides of the badge, so the parsed
            baseline has whitespace runs between badges and its text reads
            "Worship Live Music" with spaces. React would otherwise emit
            adjacent text nodes and run the words together; one space per
            separator reproduces the normalised text. The leading/trailing
            whitespace-only nodes of the row are not reproduced — whitespace
            in a flex container generates no box, so the rendered result is
            identical. No guard is added around the map: the source assumes
            an array (js/app.js:441) and throws on null. */}
        <div className="flex flex-wrap gap-2 mb-8 mt-auto pt-4">
          {work.highlights.map((highlight, index) => (
            <Fragment key={index}>
              {index > 0 ? ' ' : null}
              <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full">
                {highlight}
              </span>
            </Fragment>
          ))}
        </div>
        {/* js/app.js:459-461 — a single `w-full` div wrapping one <a>, not
            the `grid grid-cols-2 gap-4` pair the project branch uses. */}
        <div className="w-full">
          {/* js/app.js:460 — `work.source_url || '#'`: unlike the project
              branch's raw `${work.source_url}`, a null or empty source_url
              falls back to "#". The expression is always a string, so no
              template literal is needed on the href. */}
          <a
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            href={work.source_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* js/app.js:460 puts exactly one space between "Photo Album"
                and the icon; `{' '}` keeps it across the JSX line break. */}
            Photo Album{' '}
            <span className="material-icons text-sm">collections</span>
          </a>
        </div>
      </div>
    </article>
  );
}
