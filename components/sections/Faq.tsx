// index.html:666-713 — transcribed verbatim. Fully static: js/app.js has no FAQ
// renderer; it only *scrapes* `#faq details` (js/app.js:67-74) to build the
// FAQPage JSON-LD. Server component on purpose — no 'use client' and no
// controlled open state: native <details> already does the toggling, and the
// `group` class on <details> must stay because the icon span uses
// `group-open:rotate-45`.
//
// The `{'\n          '}` between each question and its icon span is
// load-bearing, not formatting. js/app.js:69 builds the FAQPage JSON-LD from
// `summary.textContent.trim()`, and index.html:678 puts a newline plus ten
// spaces there, so the published `name` is "<question>\n          add" — a
// literal newline inside a JSON-LD string. A single space renders identically
// (whitespace between flex children generates no box) but publishes a
// different `name`, so the source's exact whitespace is reproduced.
export default function Faq() {
  return (
    <section
      id="faq"
      className="defer-section max-w-7xl mx-auto px-6 py-12 lg:py-20"
    >
      <div className="max-w-4xl">
        <h2 className="font-display text-5xl md:text-7xl text-gray-900 dark:text-white leading-none">
          SEO FAQ
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Common questions from clients looking for a software developer, graphic
          designer, or photographer.
        </p>
      </div>
      <div className="mt-10 grid gap-4">
        <details className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-card-dark p-6 shadow-sm">
          <summary className="cursor-pointer list-none font-semibold text-lg text-gray-900 dark:text-white flex items-center justify-between">
            What kind of software development projects do you handle?{'\n          '}
            <span className="material-icons-outlined text-gray-400 group-open:rotate-45 transition-transform">add</span>
          </summary>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            I build responsive websites, portfolio sites, business landing pages,
            dashboards, and custom web applications with a focus on performance,
            usability, and maintainable code.
          </p>
        </details>
        <details className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-card-dark p-6 shadow-sm">
          <summary className="cursor-pointer list-none font-semibold text-lg text-gray-900 dark:text-white flex items-center justify-between">
            Do you offer graphic design services for brands and businesses?{'\n          '}
            <span className="material-icons-outlined text-gray-400 group-open:rotate-45 transition-transform">add</span>
          </summary>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Yes. I design logos, brand assets, promotional graphics, social media
            visuals, and interface layouts that align with the business message
            and audience.
          </p>
        </details>
        <details className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-card-dark p-6 shadow-sm">
          <summary className="cursor-pointer list-none font-semibold text-lg text-gray-900 dark:text-white flex items-center justify-between">
            Are you available for photography and event coverage?{'\n          '}
            <span className="material-icons-outlined text-gray-400 group-open:rotate-45 transition-transform">add</span>
          </summary>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Yes. I handle portraits, event coverage, creative shoots, and branded
            visual storytelling for individuals, communities, and businesses.
          </p>
        </details>
        <details className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-card-dark p-6 shadow-sm">
          <summary className="cursor-pointer list-none font-semibold text-lg text-gray-900 dark:text-white flex items-center justify-between">
            Can clients hire you remotely?{'\n          '}
            <span className="material-icons-outlined text-gray-400 group-open:rotate-45 transition-transform">add</span>
          </summary>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Yes. I work with remote clients on web development, design, and
            digital content projects, with communication and delivery handled
            online.
          </p>
        </details>
      </div>
    </section>
  );
}
