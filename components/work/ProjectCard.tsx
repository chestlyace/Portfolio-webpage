'use client';

import { Fragment } from 'react';
import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import type { Work } from '@/lib/types';

// js/app.js:384-417 — the `project` branch of renderWorks, transcribed from
// the source template literal. `card-hover` (on the article) and
// `dark:border-glass-border` are intentionally undefined no-op classes; they
// apply nothing and stay because they are part of today's DOM. `card-dark` is
// a real colour (#171717); `glass-border` is not a defined colour.
//
// The nullable fields are interpolated with template literals rather than as
// bare children: a template literal renders `null` as the text "null"
// (js/app.js:401), whereas React drops a null child entirely.
export default function ProjectCard({ work }: { work: Work }) {
  // js/app.js:378-381 computes this with a ternary,
  // `work.type === 'design' ? 900 : 1200` wide (height is `? 900 : 900`).
  // ProjectCard only ever receives `type === 'project'`, so the 900-wide
  // branch is unreachable here — it belongs to the design gallery's card
  // (Task 10). Writing the resolved 1200x900 out is byte-identical output.
  // The source's `|| work.image_url` fallback is not copied because
  // optimizeCloudinaryImage already returns the input unchanged for URLs
  // without `/image/upload/`, and image_url is never empty here.
  const optimizedWorkImage = optimizeCloudinaryImage(work.image_url, {
    width: 1200,
    height: 900,
    crop: 'limit',
  });

  // js/app.js:389-391 — plain truthiness, no `=== 'true'` coercion: the API
  // returns real booleans and the source does not normalise them.
  const liveBtn = work.is_live_url_private ? (
    <button
      disabled
      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 rounded-xl font-semibold text-sm cursor-not-allowed"
    >
      Private{' '}
      <span className="material-icons text-sm">lock</span>
    </button>
  ) : (
    <a
      className="flex items-center justify-center gap-2 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
      href={`${work.live_url}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Live Link{' '}
      <span className="material-icons text-sm">arrow_outward</span>
    </a>
  );

  // js/app.js:393-395 — same truthiness test, and the private state is a
  // disabled `<button>`, not an `<a>`.
  const sourceBtn = work.is_source_url_private ? (
    <button
      disabled
      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 rounded-xl font-semibold text-sm cursor-not-allowed"
    >
      Private{' '}
      <span className="material-icons text-sm">lock</span>
    </button>
  ) : (
    <a
      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
      href={`${work.source_url}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      GitHub{' '}
      <span className="material-icons text-sm">code</span>
    </a>
  );

  return (
    <article className="card-hover group relative bg-white dark:bg-card-dark border border-gray-200 dark:border-glass-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gray-300/20 dark:hover:shadow-white/5 transition-all duration-300 flex flex-col h-full">
      <div className="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          alt={`${work.title} project preview`}
          loading="lazy"
          decoding="async"
          className="thumbnail w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          // js/app.js:400 interpolates this into an innerHTML template, so a
          // null image_url serialises as `src="null"`; a bare `src={x}` would
          // drop the attribute instead. The template keeps the source's bytes.
          src={`${optimizedWorkImage}`}
        />
        <div className="absolute top-4 right-4 bg-black/70 dark:bg-white/90 text-white dark:text-black text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm uppercase tracking-wider">
          {`${work.category_label}`}
        </div>
      </div>
      <div className="p-6 md:p-8 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold font-body text-gray-900 dark:text-white mb-2">
              {work.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
              {work.description}
            </p>
          </div>
        </div>
        {/* js/app.js:385-387 joins template literals that each carry a
            newline + indent on both sides of the badge, so the parsed
            baseline has whitespace runs between badges and its text reads
            "JavaScript Mobile App Collaboration" with spaces. React would
            otherwise emit adjacent text nodes and run the words together;
            one space per separator reproduces the normalised text. The
            leading/trailing whitespace-only nodes of the row are not
            reproduced — whitespace in a flex container generates no box, so
            the rendered result is identical. */}
        <div className="flex flex-wrap gap-2 mb-8 mt-auto pt-4">
          {work.tech_stack.map((tech, index) => (
            <Fragment key={index}>
              {index > 0 ? ' ' : null}
              <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full">
                {tech}
              </span>
            </Fragment>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {liveBtn}
          {sourceBtn}
        </div>
      </div>
    </article>
  );
}
