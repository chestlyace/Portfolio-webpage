'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';
import { optimizeCloudinaryImage } from '@/lib/cloudinary';

// index.html:541-563 — section shell, and js/app.js:479-517 — renderJourney.
//
// The shell is transcribed: `defer-section relative` on the section, the
// `mb-20 text-center` header, and the `relative max-w-5xl mx-auto` container
// whose first child is `.timeline-line`. renderJourney targets
// `document.querySelector('.timeline-line').parentElement` and appends to it,
// so the items are siblings of the line — never inside it.
//
// The comment at index.html:560 produces no DOM, so it stays as a JSX comment.
//
// `isEven` is the source's own name and it is wrong: js/app.js:486 computes
// `index % 2 === 1`, i.e. it is true for ODD indices. Keep the expression
// verbatim rather than "fixing" it — recomputing parity from `index % 2 === 0`
// mirrors every card to the opposite side of the line.
//
// The class strings are built with the same ternaries as the source template,
// including the whitespace it leaves behind: for an even index the first inner
// row serialises as `flex justify-between items-start ` (trailing space) and
// the icon row as `flex items-center  gap-2 …` (double space). Those spaces are
// in today's DOM and come free with the template literals below.
//
// `logo_url` is `string | null` while `optimizeCloudinaryImage` takes a
// string, so it is coalesced at the call site (`?? ''`) as the plan prescribes.
// `optimizeCloudinaryImage('')` returns `''`, which is falsy and falls through
// to the bare `<span>LOGO</span>` placeholder — the same outcome as
// js/app.js:487-491, where `optimizeCloudinaryImage(item.logo_url, …)` returns
// `null` and `|| item.logo_url` stays `null`. The `|| item.logo_url` term is
// therefore a no-op for every value `logo_url` can take: a bare filename (the
// four seed rows) has no `/image/upload/` and is returned unchanged, and a
// Cloudinary URL is optimised, so both are already truthy.
//
// The transform is 600x600 per the brief; js/app.js:487-490 asks for
// 120x120,c_limit. Both resolve to the same rendered box (the `<img>` sits in
// a fixed `w-10 h-10` circle), so this changes bytes, not layout.
export default function Journey() {
  const { data } = usePortfolio();

  return (
    <section className="defer-section relative" id="journey">
      <header className="mb-20 text-center">
        <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display tracking-tight leading-none">
          MY JOURNEY &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-900 dark:from-gray-400 dark:to-white">
            TIMELINE
          </span>
        </h2>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium tracking-[0.2em] uppercase mb-6">
          A mix of professional experience and academic milestones shaping my career.
        </p>
      </header>

      <div className="relative max-w-5xl mx-auto">
        <div className="timeline-line bg-gray-200 dark:bg-white/10"></div>
        {/* Journey items will be injected here */}
        {/* js/app.js:485 walks the array in API order and there is no sort on
            `order_index` anywhere — array order is render order. */}
        {(data?.journey ?? []).map((item, index) => {
          const isEven = index % 2 === 1;
          const optimizedLogoUrl = optimizeCloudinaryImage(item.logo_url ?? '', {
            width: 600,
            height: 600,
          });

          return (
            <div className="relative mb-12 md:mb-20" key={item.id}>
              <div
                className={`flex flex-col ${
                  isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                } items-center w-full`}
              >
                <div className="hidden md:block md:w-5/12"></div>
                <div
                  className={`w-full md:w-5/12 ${
                    isEven
                      ? 'pl-16 md:pl-8'
                      : 'pl-16 md:pl-0 md:pr-8 text-left md:text-right'
                  }`}
                >
                  <div className="p-6 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/10 shadow-lg glass-card hover:translate-y-[-4px] transition-transform duration-300">
                    <div
                      className={`flex justify-between items-start ${
                        !isEven ? 'flex-row-reverse md:flex-row' : ''
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          !isEven ? 'md:justify-end' : ''
                        } gap-2 text-primary text-sm font-semibold mb-2`}
                      >
                        {/* js/app.js:500 — the type drives the icon; anything
                            that is not exactly 'work' renders `school`. */}
                        <span className="material-icons-round text-base">
                          {item.type === 'work' ? 'work' : 'school'}
                        </span>
                        <span>{item.dates}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10">
                        {optimizedLogoUrl ? (
                          <img
                            src={optimizedLogoUrl}
                            alt={`${item.company} logo`}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">LOGO</span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {item.role}
                    </h3>
                    {/* js/app.js:508 — the `@ ` prefix lives inside the <p>. */}
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      {`@ ${item.company}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
