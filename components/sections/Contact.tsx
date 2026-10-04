'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';
import type { Social } from '@/lib/types';
import ContactForm from '@/components/sections/ContactForm';

// index.html:564-618 — section shell, heading, contact rows, social grid and
// WhatsApp card; js/app.js:296-303 — the `.contact-email` / `.contact-phone`
// and `mailto:` / `tel:` bindings; js/app.js:519-538 — renderSocials.
//
// The shell is transcribed, not reworded: `defer-section relative z-10 …` on
// the section, the `mb-12 lg:mb-20 text-center lg:text-left` header, the
// `leading-[0.85] tracking-tighter uppercase` h2, and the 12-column grid.
//
// Apostrophes are the source's own bytes: "Let's Work" (h2) and "it's
// development" (paragraph) are ASCII `'`, "Let’s create" is a right single
// quotation mark U+2019 (index.html:568,571). Do not normalise them.
//
// js/app.js:296-297 writes `.textContent` from the API and js/app.js:298-303
// rewrites **every** `a[href^="mailto:"]` / `a[href^="tel:"]` page-wide. In
// this component the two anchors *are* those matches, so they are bound
// directly instead of being rewritten after the fact. `tel:` is the only place
// whitespace is stripped (`/\s+/g`, all whitespace, not just spaces) — the
// visible `.contact-phone` keeps its spaces, exactly as the source does.
// Both classes keep their static fallbacks as the server-rendered children:
// before the API answers, today's page shows those literals.
//
// The right column (`<div className="lg:col-span-7">`) is intentionally empty —
// index.html:618-660 holds the contact form there, which Task 15 mounts.
//
// `glass-panel` (on the social anchors) and `dark:bg-surface-dark` (on the two
// contact rows and the WhatsApp card) are two of the seven intentionally
// undefined no-op classes: `surface` is not a colour in tailwind.config.ts, so
// `bg-surface-dark` compiles to nothing. Copy both verbatim, never define them.
// `bg-background-dark` in the same anchor *is* a real token.
//
// No <SectionBoundary>: nothing here throws on a miss — every container that
// would be an API-dependent render target is either static markup or a
// `data?.socials ?? []` map, and the source's comment node inside the social
// grid is wiped by js/app.js:525 (`innerHTML = ''`) before it ever renders.
export default function Contact() {
  const { data } = usePortfolio();
  const profile = data?.profile ?? null;

  const email = profile?.email ?? '';
  const phone = profile?.phone ?? '';

  return (
    <section
      id="contact"
      className="defer-section relative z-10 w-full max-w-7xl mx-auto px-6 py-12 lg:py-20 flex-grow"
    >
      <div className="mb-12 lg:mb-20 text-center lg:text-left">
        <h2 className="text-6xl md:text-8xl lg:text-9xl font-display dark:text-white leading-[0.85] tracking-tighter uppercase mb-4">
          Let's Work <br />
          <span className="text-gray-400 dark:text-gray-500">Together</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mt-6 font-light">
          Have a project in mind? Let’s create something extraordinary. Whether it's development, design, or photography.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-6">
            <a
              className="group flex items-center space-x-4 p-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 hover:border-primary dark:hover:border-gray-600 transition-all shadow-sm"
              href={`mailto:${email}`}
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center dark:text-white group-hover:scale-110 transition-transform">
                <span className="material-icons-outlined">email</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                  Email Me
                </p>
                <p className="text-lg font-medium dark:text-white break-all contact-email">
                  {email || 'developerace0@gmail.com'}
                </p>
              </div>
            </a>
            <a
              className="group flex items-center space-x-4 p-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 hover:border-primary dark:hover:border-gray-600 transition-all shadow-sm"
              href={`tel:${phone.replace(/\s+/g, '')}`}
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center dark:text-white group-hover:scale-110 transition-transform">
                <span className="material-icons-outlined">call</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                  Call Me
                </p>
                <p className="text-lg font-medium dark:text-white contact-phone">
                  {phone || '+237 676 940 247'}
                </p>
              </div>
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
              Connect Socially
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {/* Socials will be injected here */}
              {(data?.socials ?? []).map((social) => {
                // js/app.js:529 — `social.name` is a leftover: the socials
                // table has no `name` column (db/neon_setup.sql:80-85), so the
                // term can only ever be undefined. Keep it for parity with the
                // source; the intersection cast keeps tsc quiet about it.
                const socialName =
                  social.platform ||
                  (social as Social & { name?: string }).name ||
                  'Social profile';

                return (
                  <a
                    key={social.id}
                    className="aspect-square flex flex-col items-center justify-center rounded-xl glass-panel bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:bg-background-dark hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
                    href={`${social.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${socialName}`}
                  >
                    <i className={social.icon + ' text-2xl mb-1'} aria-hidden="true"></i>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 inline-flex items-center space-x-4 shadow-sm">
            <div className="w-24 h-24 bg-gray-200 dark:bg-white rounded-lg flex items-center justify-center overflow-hidden">
              <img
                alt="Scan to connect on WhatsApp"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover p-1"
                src="assets/img/wa_logo.jpeg"
              />
            </div>
            <div>
              <p className="font-display text-xl dark:text-white tracking-wide">
                Scan To<br />
                Connect
              </p>
              <p className="text-xs text-gray-500 mt-1">Instant vCard Access</p>
            </div>
          </div>
        </div>

        {/* index.html:618-660 — contact form; Task 15 mounts ContactForm here. */}
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
