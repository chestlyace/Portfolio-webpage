'use client';

import { useState } from 'react';
import WorkTabs, { type Tab } from '@/components/work/WorkTabs';
import ProjectCard from '@/components/work/ProjectCard';
import DesignMasonry from '@/components/work/DesignMasonry';
import { SectionBoundary } from '@/components/ui/SectionBoundary';
import { usePortfolio } from '@/lib/PortfolioProvider';

// index.html:492-539. showSection (index.html:875-896) is replaced by one
// useState: the active tab hides the two sibling containers with Tailwind's
// `hidden` utility, appended at the end of the class string exactly as
// classList.add would. `section-content` is a JS-hook class with no CSS
// definition — it stays because showSection (index.html:877) selects on it
// and because it is part of today's DOM.
export default function Work() {
  const [tab, setTab] = useState<Tab>('projects');
  const { data } = usePortfolio();

  // js/app.js:377 walks the array in API order and js/app.js:384 writes only
  // `type === 'project'` into this container, so API order is render order
  // (ids 29,30,31,32,33,34,1) and nothing is sorted.
  const projects = (data?.works ?? []).filter((w) => w.type === 'project');

  return (
    <section
      id="work"
      className="defer-section max-w-7xl mx-auto px-6 py-12 flex flex-col items-center"
    >
      <header className="mb-11 space-y-4 ml--10 text-left">
        <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display tracking-tight leading-none whitespace-nowrap">
          WORK, VISUALS &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-900 dark:from-gray-400 dark:to-white">
            STORIES
          </span>
        </h2>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium tracking-[0.2em] uppercase">
          Selected Works 2023-2026
        </p>
      </header>
      <WorkTabs active={tab} onChange={setTab} />
      {/* index.html:524-526 — placeholder children; Tasks 9-11 swap in
          their own content and add the SectionBoundary here. */}
      <div
        id="projects-section"
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full section-content${
          tab === 'projects' ? '' : ' hidden'
        }`}
      >
        <SectionBoundary fallback={<>{/* Projects will be injected here */}</>}>
          {projects.map((work) => (
            <ProjectCard key={work.id} work={work} />
          ))}
        </SectionBoundary>
      </div>
      <div
        id="design-section"
        className={`w-full section-content${tab === 'design' ? '' : ' hidden'}`}
      >
        <div className="masonry-gallery">
          <SectionBoundary fallback={<>{/* Designs will be injected here */}</>}>
            <DesignMasonry />
          </SectionBoundary>
        </div>
      </div>
      <div
        id="events-section"
        className={`grid grid-cols-1 md:grid-cols-2 gap-8 w-full section-content${
          tab === 'events' ? '' : ' hidden'
        }`}
      >
        {/* Events will be injected here */}
      </div>
    </section>
  );
}
