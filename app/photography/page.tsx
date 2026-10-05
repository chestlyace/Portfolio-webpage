{/* photography.html:74-155 — <header> through </main>, transcribed
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
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Photography Services</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">Portraits, events, and branded visuals that capture the story behind the moment.</h1>
          <p className="mt-6 max-w-3xl text-lg text-white/70">
          {'\n        I provide photography services for people, brands, and communities that need strong visual storytelling, reliable event coverage, and polished final images.\n      '}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black" href="/#contact">Book a Session</a>
            <a className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white" href="/#work">See Visual Work</a>
          </div>
        </section>

        <section className="bg-white text-neutral-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-3">
            <article className="rounded-3xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-semibold">Event coverage</h2>
              <p className="mt-4 text-neutral-600">Coverage for conferences, launches, community events, and special programs with consistent visual storytelling.</p>
            </article>
            <article className="rounded-3xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-semibold">Portrait sessions</h2>
              <p className="mt-4 text-neutral-600">Portraits for individuals, teams, creators, and personal brands who need expressive and clean imagery.</p>
            </article>
            <article className="rounded-3xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-semibold">Brand content</h2>
              <p className="mt-4 text-neutral-600">Photo assets for websites, social channels, announcements, recaps, and promotional campaigns.</p>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-4xl font-semibold">Photography services offered</h2>
              <ul className="mt-6 space-y-4 text-white/75">
                <li>Event photography for conferences, communities, and launches</li>
                <li>Portrait photography for professionals and personal brands</li>
                <li>Creative photography for storytelling and campaigns</li>
                <li>Photo selection and delivery for social media and web use</li>
                <li>Visual support for recaps, promotion, and branded publishing</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-3xl font-semibold">Search intent covered here</h2>
              <p className="mt-4 text-white/70">
              {'\n            This page targets searches such as photographer portfolio, event photographer, portrait photographer, and freelance photographer for branded content.\n          '}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-neutral-950">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-4xl font-semibold">Frequently asked questions</h2>
            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Do you cover events and community programs?</h3>
                <p className="mt-3 text-white/70">Yes. Event coverage is one of the key photography services I provide.</p>
              </div>
              <div className="rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Can the photos be used for websites and social media?</h3>
                <p className="mt-3 text-white/70">Yes. Deliverables can support websites, recaps, social posts, and campaign materials.</p>
              </div>
              <div className="rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Do you also support visual storytelling for brands?</h3>
                <p className="mt-3 text-white/70">Yes. I combine photography with design and digital presentation to help brands communicate clearly.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
