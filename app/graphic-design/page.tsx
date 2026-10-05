{/* graphic-design.html:74-155 — <header> through </main>, transcribed
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
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Graphic Design Services</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">Brand visuals and digital graphics that look intentional and communicate clearly.</h1>
          <p className="mt-6 max-w-3xl text-lg text-white/70">
          {'\n        I create design assets that support brands, campaigns, events, and online products, from logos and promotional graphics to digital content for social media and presentations.\n      '}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black" href="/#contact">Request Design Work</a>
            <a className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white" href="/#work">See Design Samples</a>
          </div>
        </section>

        <section className="bg-white text-neutral-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-3">
            <article className="rounded-3xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-semibold">Branding support</h2>
              <p className="mt-4 text-neutral-600">Logos, identity directions, brand graphics, and visual consistency for growing businesses and creators.</p>
            </article>
            <article className="rounded-3xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-semibold">Campaign assets</h2>
              <p className="mt-4 text-neutral-600">Social media graphics, posters, flyers, promo banners, launch visuals, and event collateral.</p>
            </article>
            <article className="rounded-3xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-semibold">Digital product visuals</h2>
              <p className="mt-4 text-neutral-600">Interface mockups, presentation slides, and support graphics for websites and digital products.</p>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-4xl font-semibold">Design work I offer</h2>
              <ul className="mt-6 space-y-4 text-white/75">
                <li>Logo and identity support for small brands and personal businesses</li>
                <li>Social media graphics for marketing and community growth</li>
                <li>Poster, flyer, and event announcement design</li>
                <li>Presentation and pitch-deck visual support</li>
                <li>Creative direction for visual storytelling across channels</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-3xl font-semibold">Search intent covered here</h2>
              <p className="mt-4 text-white/70">
              {'\n            This page is designed to support searches such as graphic designer portfolio, freelance graphic designer, social media designer, brand designer, and event poster designer.\n          '}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-stone-900">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-4xl font-semibold">Frequently asked questions</h2>
            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Do you design for both print and digital use?</h3>
                <p className="mt-3 text-white/70">Yes. I can prepare assets for digital campaigns and designs intended for print output.</p>
              </div>
              <div className="rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Can you create social media graphics for a campaign?</h3>
                <p className="mt-3 text-white/70">Yes. I design campaign-ready graphics tailored for announcements, promotions, and audience engagement.</p>
              </div>
              <div className="rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">Do you work with businesses and personal brands?</h3>
                <p className="mt-3 text-white/70">Yes. I work with both organizations and individuals who need a stronger visual presence.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
