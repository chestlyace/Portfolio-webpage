'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';
import type { Skill } from '@/lib/types';

function SkillTile({ skill }: { skill: Skill }) {
  return (
    <div className="flex flex-col items-center group">
      <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm group-hover:border-primary/50 group-hover:shadow-glow transition-all duration-300">
        {skill.icon.startsWith('http') ? (
          <img
            src={skill.icon}
            alt={`${skill.name} logo`}
            loading="lazy"
            decoding="async"
            className="w-8 h-8 group-hover:scale-110 transition-transform"
          />
        ) : (
          <i className={`${skill.icon} text-3xl`} aria-hidden="true"></i>
        )}
      </div>
      <span className="mt-2 text-[10px] uppercase font-bold text-slate-400 group-hover:text-primary transition-colors">
        {skill.name}
      </span>
    </div>
  );
}

export default function Skills() {
  const { data } = usePortfolio();

  // js/app.js:324-326 — a three-way if/else-if with no else: anything that is
  // not exactly 'language', 'framework' or 'tool' is dropped, never re-routed.
  // Single pass in API order, so each bucket keeps array order.
  const languages: Skill[] = [];
  const frameworks: Skill[] = [];
  const tools: Skill[] = [];
  for (const skill of data?.skills ?? []) {
    if (skill.category === 'language') languages.push(skill);
    else if (skill.category === 'framework') frameworks.push(skill);
    else if (skill.category === 'tool') tools.push(skill);
  }

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-4">Languages</span>
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-grow"></div>
        </div>
        <div className="skills-languages grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
          {languages.map((skill) => (
            <SkillTile key={skill.id} skill={skill} />
          ))}
        </div>
      </div>
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-4">Frameworks</span>
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-grow"></div>
        </div>
        <div className="skills-frameworks grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
          {frameworks.map((skill) => (
            <SkillTile key={skill.id} skill={skill} />
          ))}
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-center mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-4">Tools</span>
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-grow"></div>
        </div>
        <div className="skills-tools grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
          {tools.map((skill) => (
            <SkillTile key={skill.id} skill={skill} />
          ))}
        </div>
      </div>
    </>
  );
}
