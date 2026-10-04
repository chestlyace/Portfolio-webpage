'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';
import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import type { Social } from '@/lib/types';

export default function Hero() {
  const { data } = usePortfolio();
  const profile = data?.profile ?? null;

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center pt-24 pb-12 px-6 bg-grid-pattern">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center bg-grid-pattern">
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 bg-grid-pattern">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Open to Remote Roles
          </div>
          <div className="relative leading-none select-none">
            <h1 className="sr-only">Chestly Ace, also known as Amahndong Chestly, portfolio: software developer, graphic designer, and photographer</h1>
            <div className="text-[100px] sm:text-[140px] md:text-[180px] lg:text-[160px] xl:text-[200px] font-display tracking-tighter text-slate-900 dark:text-white mix-blend-overlay lg:mix-blend-normal opacity-90">
              <span className="font-light hero-title-1">{profile?.title_1 ?? 'Developer'}</span>
            </div>
            <div className="text-[100px] sm:text-[140px] md:text-[180px] lg:text-[160px] xl:text-[200px] font-display tracking-tighter text-slate-900 dark:text-white -mt-8 sm:-mt-12 lg:-mt-12">
              <span className="font-light hero-title-2">{profile?.title_2 ?? 'Designer'}</span>
            </div>
            <div className="text-[50px] sm:text-[70px] md:text-[90px] lg:text-[100px] font-display tracking-wide text-outline text-slate-900 dark:text-white opacity-40 -mt-2 sm:-mt-4 lg:-mt-6 hero-title-3">
              {`& ${profile?.title_3 ?? 'PHOTOGRAPHER'}`}
            </div>
          </div>
          <div className="hero-tagline flex flex-wrap justify-center lg:justify-start gap-4 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sans">
            {profile?.tagline ?? 'Software developer, graphic designer, and photographer crafting modern digital experiences.'}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Amahndong Chestly, known professionally as Chestly Ace, builds websites, brand visuals, and photography-driven digital experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
            <a
              className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 dark:shadow-white/10"
              href="#work">
              View My Work
              <span className="material-icons-outlined text-sm">arrow_forward</span>
            </a>
            <a
              className="px-8 py-4 glass-light dark:glass rounded-full font-bold text-lg text-slate-900 dark:text-white hover:bg-white/20 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              href="#contact">
              Get In Touch
              <span className="material-icons-outlined text-sm">mail</span>
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-4 lg:gap-6 pt-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <i className="fab fa-whatsapp text-lg"></i>
              <span className="contact-phone">{profile?.phone ?? '+237 676 940 247'}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="far fa-envelope text-lg"></i>
              <span className="contact-email">{profile?.email ?? 'developerace0@gmail.com'}</span>
            </div>
            <div className="flex gap-3 text-xl">
              {/* Socials will be injected here */}
              {/* js/app.js:530 — `renderSocials` writes into this container as
                  its first of three targets (the others are
                  `#contact .grid.grid-cols-4.gap-4` and
                  `footer .flex.space-x-4`, migrated in Tasks 14 and 17). Note
                  this is the *hero* row, not the navbar, despite the AGENTS.md
                  shorthand. The anchor class differs per target: this one is
                  `hover:text-primary transition-colors`, and the `<i>` carries
                  the ligature name with no size utility. */}
              {(data?.socials ?? []).map((social) => {
                // js/app.js:529 — `social.name` is a leftover: the socials table
                // has no `name` column (db/neon_setup.sql:80-85), so the term can
                // only ever be undefined. Kept for parity with the source.
                const socialName =
                  social.platform ||
                  (social as Social & { name?: string }).name ||
                  'Social profile';

                return (
                  <a
                    key={social.id}
                    className="hover:text-primary transition-colors"
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
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end mt-12 lg:mt-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-[60px] -z-10"></div>
          <div className="relative group w-full max-md">
            <div className="absolute top-[15%] -left-[5%] z-20 sticker bg-[#20232a] p-2 rounded-lg shadow-lg rotate-[-12deg] border border-slate-700">
              <i className="fab fa-react text-[#61dafb] text-3xl"></i>
            </div>
            <div className="absolute bottom-[20%] -left-[2%] z-20 sticker bg-white p-1.5 rounded shadow-lg rotate-[6deg]">
              <i className="fab fa-aws text-[#FF9900] text-3xl"></i>
            </div>
            <div className="absolute bottom-[10%] right-[10%] z-20 sticker bg-[#3ddc84] p-2 rounded-full shadow-lg rotate-[-8deg] border border-green-600">
              <i className="fab fa-android text-white text-2xl"></i>
            </div>
            <div className="absolute top-[30%] -right-[8%] z-20 sticker bg-slate-800 text-white p-2 rounded-lg shadow-lg rotate-[15deg]">
              <span className="material-icons-outlined text-2xl">camera_alt</span>
            </div>
            <div className="relative overflow-hidden rounded-b-full rounded-t-[14rem] border-2 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-neutral-900 shadow-2xl">
              <img
                alt="Chestly Ace Portrait"
                width={1200}
                height={1600}
                fetchPriority="high"
                decoding="async"
                className="hero-image w-full h-auto object-cover grayscale contrast-125 filter group-hover:grayscale-0 transition-all duration-700 ease-out"
                src={
                  optimizeCloudinaryImage(profile?.hero_image ?? '', {
                    width: 1200,
                    height: 1600,
                    crop: 'limit',
                  }) || 'hero-optimized.webp'
                }
                style={{ aspectRatio: '3/4' }}
              />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-100 dark:from-background-dark to-transparent"></div>
            </div>
            <div className="absolute top-[5%] -right-[5%] sm:-right-[10%] z-30 max-w-[180px]">
              <div className="glass-light dark:glass p-4 rounded-xl rounded-bl-none shadow-xl transform rotate-2 hover:rotate-0 transition-transform cursor-pointer">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">@Dev.Ace</span>
                  <span className="material-icons-outlined text-blue-500 text-sm">verified</span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed">
                  "Chill and relax, it's the weekend. Not you devs &amp; designers, go complete your client's projects."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
        <span className="material-icons-outlined text-slate-400 dark:text-slate-600 text-3xl">keyboard_arrow_down</span>
      </div>
    </main>
  );
}
