'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';

export default function Navbar() {
  const { data } = usePortfolio();
  const profile = data?.profile ?? null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-center">
      <div className="glass-light dark:glass rounded-full px-6 py-3 flex items-center justify-between gap-8 max-w-4xl w-full shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold font-display text-lg tracking-wider">
            <img src="assets/img/69059dfc-d514-4861-b68a-3de1b6f12b58.png" alt="Chestly Ace logo" />
          </div>
          <span className="font-display text-xl tracking-wide hidden sm:block profile-name">
            {profile?.display_name ?? 'DEV.ACE'}
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a className="hover:text-primary transition-colors" href="#">HOME</a>
          <a className="hover:text-primary transition-colors" href="#about">ABOUT </a>
          <a className="hover:text-primary transition-colors" href="#services">SERVICES</a>
          <a className="hover:text-primary transition-colors" href="#work">WORK</a>
          <a className="hover:text-primary transition-colors" href="#journey">EXPERIENCE</a>
          <a className="hover:text-primary transition-colors" href="#contact">CONTACT</a>
        </div>
        <a
          className="bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border border-slate-200 dark:border-neutral-700"
          href="https://chestlyace.online/"
        >
          <span className="material-icons-outlined text-sm">language</span>
          chestlyace.online
        </a>
        {/* Inert in index.html:268-270 — no id, no aria-expanded, no handler
            anywhere in js/app.js. Rendered exactly as written on purpose. */}
        <button className="md:hidden text-slate-800 dark:text-white">
          <span className="material-icons-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
}
