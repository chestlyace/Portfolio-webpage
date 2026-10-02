'use client';

// index.html:510-521 — the three category pills. Each button's transition
// utility is a per-button constant: showSection (index.html:875-896) never
// touches it, so #btn-projects keeps transition-all and the other two keep
// transition-colors in every tab state. `category-btn` is a JS-hook class
// with no CSS definition; showSection (index.html:885) selects on it.
export type Tab = 'projects' | 'design' | 'events';

// index.html:886-887 / 893-894 — the exact classList sets showSection
// removes and adds. shadow-lg is part of the active state too, but the
// source puts it between the transition class and category-btn, so it is
// emitted there rather than inside ACTIVE.
const ACTIVE = 'bg-black text-white dark:bg-white dark:text-black';
const INACTIVE =
  'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white';

const TABS: { id: Tab; label: string; transition: string }[] = [
  { id: 'projects', label: 'PROJECTS', transition: 'transition-all' },
  { id: 'design', label: 'DESIGN GALLERY', transition: 'transition-colors' },
  { id: 'events', label: 'EVENTS', transition: 'transition-colors' },
];

interface WorkTabsProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function WorkTabs({ active, onChange }: WorkTabsProps) {
  return (
    <div className="mb-20 inline-flex items-center bg-gray-200/50 dark:bg-white/5 backdrop-blur-md border border-gray-300 dark:border-white/10 p-1.5 rounded-full">
      {TABS.map(({ id, label, transition }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            id={`btn-${id}`}
            onClick={() => onChange(id)}
            className={`px-6 py-2.5 rounded-full ${
              isActive ? ACTIVE : INACTIVE
            } font-medium text-sm ${transition} ${
              isActive ? 'shadow-lg ' : ''
            }category-btn`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
