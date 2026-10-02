'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';
import type { Service } from '@/lib/types';

// js/app.js:144-150 — copied verbatim. The order of the checks and the
// substring tests are the contract: 'software' before 'design' before
// 'photo', each an `includes` on the lowercased title. Three services
// navigate to separate subpages; anything unmatched falls to '#contact',
// which is how 'Event Coverage' behaves in production today.
function getServiceLink(serviceTitle: string) {
  const normalizedTitle = (serviceTitle || '').toLowerCase();
  if (normalizedTitle.includes('software')) return 'software-development.html';
  if (normalizedTitle.includes('design')) return 'graphic-design.html';
  if (normalizedTitle.includes('photo')) return 'photography.html';
  return '#contact';
}

export default function Services() {
  const { data } = usePortfolio();

  return (
    <section
      className="defer-section py-24 bg-white dark:bg-background-dark relative overflow-hidden transition-colors duration-300"
      id="services"
    >
      {/* index.html:477 — bg-grid-pattern is an intentionally undefined
          no-op class; the div and its opacity-10 are real. */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="mb-16">
          <h2 className="font-display text-7xl md:text-9xl text-gray-900 dark:text-white leading-none">
            SERVICES
          </h2>
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mt-2 ml-2">
            What I can do for you
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Services will be injected here */}
          {(data?.services ?? []).map((service: Service) => {
            const serviceLink = getServiceLink(service.title);
            return (
              <div
                key={service.id}
                className="group relative bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-10 rounded-3xl overflow-hidden hover:border-black dark:hover:border-white transition-all duration-300"
              >
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition duration-500 transform group-hover:scale-110">
                  <span className="material-icons-outlined text-9xl">{service.icon}</span>
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                    <span className="material-icons-outlined text-3xl">{service.icon}</span>
                  </div>
                  <h3 className="font-display text-4xl mb-4">{service.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="space-y-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {service.items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2"
                      >
                        <span className="text-black dark:text-white">→</span> {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white hover:text-primary transition-colors"
                    href={serviceLink}
                  >
                    Learn More{' '}
                    <span className="material-icons-outlined text-base">arrow_forward</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
