{/* software-development.html:74-155 — <header> through </main>, transcribed
    verbatim (line 156 is </body>, which belongs to the layout above). */}
export default function Page() {
  return (
    <>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a className="text-lg font-semibold tracking-wide" href="/">Chestly Ace</a>
          <nav className="flex gap-6 text-sm text-white/70">
            <a className="hover:text-white" href="/#services">Services</a>
            <a className="hover:text-white" href="/#work">Work</a>
            <a className="hover:text-white" href="/#contact">Contact</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Software Development Services</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">Websites and web apps built for speed, clarity, and conversion.</h1>
          <p className="mt-6 max-w-3xl text-lg text-white/70">
          {'\n        I help businesses, creators, and teams launch responsive websites, landing pages, portfolio sites, and custom web experiences with modern frontend and backend development.\n      '}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black" href="/#contact">Start a Project</a>
            <a className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white" href="/#work">View Portfolio</a>
          </div>
        </section>

        <section className="bg-white text-neutral-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-3">
            <article className="rounded-3xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-semibold">What I build</h2>
              <p className="mt-4 text-neutral-600">Business websites, landing pages, personal portfolios, dashboards, event microsites, and custom interfaces.</p>
            </article>
            <article className="rounded-3xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-semibold">What matters</h2>
              <p className="mt-4 text-neutral-600">Performance, mobile responsiveness, maintainable code, strong UI structure, and clean delivery.</p>
            </article>
            <article className="rounded-3xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-semibold">Who it is for</h2>
              <p className="mt-4 text-neutral-600">Startups, founders, personal brands, community initiatives, and businesses that need a serious web presence.</p>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-4xl font-semibold">Core development services</h2>
              <ul className="mt-6 space-y-4 text-white/75">
                <li>Responsive website development for desktop and mobile</li>
                <li>Landing pages for campaigns, products, and lead generation</li>
                <li>Portfolio website development for creators and professionals</li>
                <li>Frontend interfaces with HTML, CSS, JavaScript, React, and Tailwind CSS</li>
                <li>Backend integration and API-driven features where needed</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-3xl font-semibold">Why this page exists</h2>
              <p className="mt-4 text-white/70">
              {'\n            Clients often search for terms like software developer portfolio, freelance web developer, landing page developer, or website developer for small business. This page is built to clearly describe those services and make them easy to find.\n          '}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-neutral-900">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-4xl font-semibold">Frequently asked questions</h2>
            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Do you work with remote clients?</h3>
                <p className="mt-3 text-white/70">Yes. Project communication, review, and delivery can be handled remotely.</p>
              </div>
              <div className="rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Can you build a portfolio website or business landing page?</h3>
                <p className="mt-3 text-white/70">Yes. That is one of the main services I provide, with attention to speed, design, and content structure.</p>
              </div>
              <div className="rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Do you also help with UI and presentation?</h3>
                <p className="mt-3 text-white/70">Yes. My design background helps ensure the interface is usable, clear, and aligned with the brand.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
