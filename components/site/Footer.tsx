'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';
import type { Social } from '@/lib/types';

// index.html:768-835 — footer, transcribed verbatim: the `bg-gray-900
// dark:bg-black … border-t border-gray-800` shell, the four-column grid, the
// bottom bar, and the three distinct link-row class strings.
//
// js/app.js:282 writes `.profile-name` with `querySelectorAll`, so the navbar
// span (index.html:253) **and** this `h4` are both overwritten with
// `profile.display_name` ("DEV.ACE" once the API answers). The static
// server-rendered child is the source's own `Dev.ACE` — lowercase `ev`,
// unlike the navbar's `DEV.ACE`; each was transcribed from its own line.
//
// js/app.js:519-538 — renderSocials. This is the third of its three targets;
// `footer .flex.space-x-4` is the socials div, not the bottom bar's
// `div.flex.space-x-6` (Privacy/Terms) — different token, never merged. The
// footer anchor class `text-gray-400 hover:text-white transition-colors` is
// its own variant: not the hero's `hover:text-primary`, not the contact
// grid's long `aspect-square …` string. `<i>` carries the ligature name only,
// no `text-2xl mb-1` (that is the contact variant).
//
// Service links are root-absolute (`/graphic-design.html`) with a leading
// slash — plain <a>, never the router's <Link>; sitemap.xml publishes those
// paths at the domain root and a router link would resolve them against the
// app routes instead.
//
// The subscribe form has no handler in the source: the <input> has no
// name/id/value and the <button> has no `type` (so it keeps the implicit
// `submit` that navigates today). Both are transcribed as static markup —
// add nothing.

export default function Footer() {
  const { data } = usePortfolio();
  const profile = data?.profile ?? null;

  return (
    <footer className="bg-gray-900 dark:bg-black text-white pt-20 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-display text-2xl tracking-wider">
                <img src="assets/img/69059dfc-d514-4861-b68a-3de1b6f12b58.png" alt="Chestly Ace logo" />
              </div>
              <div>
                <h4 className="font-display text-3xl tracking-wide profile-name">
                  {profile?.display_name ?? 'Dev.ACE'}
                </h4>
                <p className="text-xs text-gray-400">Since 2023</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Crafting digital experiences with precision code and creative design. Bringing your vision to life, one
              pixel at a time.
            </p>
          </div>
          <div>
            <h5 className="font-display text-xl tracking-wider mb-6">Quick Links</h5>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a className="hover:text-white transition-colors" href="#">Home</a></li>
              <li><a className="hover:text-white transition-colors" href="#about">About</a></li>
              <li><a className="hover:text-white transition-colors" href="#services">Services</a></li>
              <li><a className="hover:text-white transition-colors" href="#work">Work</a></li>
              <li><a className="hover:text-white transition-colors" href="#journey">Experience</a></li>
              <li><a className="hover:text-white transition-colors" href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-display text-xl tracking-wider mb-6">Services</h5>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a className="hover:text-white transition-colors" href="/software-development.html">Software Development</a></li>
              <li><a className="hover:text-white transition-colors" href="/graphic-design.html">Graphic Design</a></li>
              <li><a className="hover:text-white transition-colors" href="/photography.html">Photography</a></li>
              <li><a className="hover:text-white transition-colors" href="#contact">Project Consultation</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-display text-xl tracking-wider mb-6">Stay Updated</h5>
            <p className="text-gray-400 text-xs mb-4">Subscribe for the latest updates and offers.</p>
            <form className="space-y-3">
              <input
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/40 transition-colors text-sm"
                placeholder="Your email address" type="email" />
              <button
                className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-gray-500">
            © 2026 Chestly Ace. All Rights Reserved.
          </p>
          <div className="flex space-x-6">
            <a className="text-gray-500 hover:text-white transition-colors text-xs" href="#">Privacy Policy</a>
            <a className="text-gray-500 hover:text-white transition-colors text-xs" href="#">Terms of Service</a>
          </div>
          <div className="flex space-x-4">
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
                  className="text-gray-400 hover:text-white transition-colors"
                  href={`${social.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${socialName}`}
                >
                  <i className={social.icon} aria-hidden="true"></i>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
