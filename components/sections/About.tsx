'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';
import Skills from './Skills';

export default function About() {
  const { data } = usePortfolio();
  const profile = data?.profile ?? null;

  const quote = profile
    ? `"${profile.about_quote}"`
    : '"Blending logic with creativity to craft digital experiences that matter."';

  const about1 =
    profile?.about_text_1 ??
    "Hi! I'm Chestly, Amahndong Chestly by full name, a multidisciplinary creator blending software development, graphic design, and photography to build digital experiences with clarity and personality.";

  const about2 =
    profile?.about_text_2 ??
    "I approach websites, brands, and visuals with the same mindset: solve the problem clearly, make it look intentional, and create something people remember.";

  return (
    <section
      className="defer-section py-20 bg-gray-50 dark:bg-[#181818] transition-colors duration-300"
      id="about">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="font-display text-6xl md:text-8xl text-gray-900 dark:text-white">
              ABOUT ME
            </h2>
            <div className="relative pl-8 border-l-4 border-black dark:border-white">
              <p className="about-quote font-serif italic text-2xl text-gray-600 dark:text-gray-300">
                {quote}
              </p>
            </div>
            <div className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300">
              <p className="about-text-1">
                <span className="float-left text-7xl font-display leading-none mr-4 mt-2 text-black dark:text-white">
                  {about1.charAt(0)}
                </span>
                {about1.slice(1)}
              </p>
              <p className="about-text-2">{about2}</p>
            </div>
            <div className="pt-4">
              <a
                className="resume-link inline-flex items-center gap-2 border-b-2 border-black dark:border-white pb-1 font-bold hover:text-gray-600 dark:hover:text-gray-300 transition"
                href={profile?.resume_url ?? 'resume.pdf'}
                download="Chestly_Ace_Resume">
                Download My Resume
                <span className="material-icons-outlined">arrow_forward</span>
              </a>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-display text-3xl mb-8 text-right hidden lg:block">
              My Arsenal
            </h3>
            <div className="lg:col-span-7">
              <div className="glass-panel light-glass-panel bg-slate-100/50 dark:bg-[#1A1A1A] p-8 rounded-2xl border border-slate-200 dark:border-white/5 relative">
                <h3 className="text-2xl font-display font-semibold mb-8 text-slate-900 dark:text-white flex items-center">
                  <span className="material-icons-outlined text-primary mr-3">code</span>
                  Skills / Tech Stack
                </h3>
                <Skills />
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 text-xs font-semibold border border-yellow-200 dark:border-yellow-700/50">
                    Teamwork
                  </span>
                  <span className="px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-xs font-semibold border border-blue-200 dark:border-blue-700/50">
                    Problem Solving
                  </span>
                  <span className="px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 text-xs font-semibold border border-green-200 dark:border-green-700/50">
                    Agile
                  </span>
                  <span className="px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 text-xs font-semibold border border-purple-200 dark:border-purple-700/50">
                    Communication
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
