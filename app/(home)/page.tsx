// index.html:240-916 — the top-level body children, in source order. The
// swirl overlay and the <head> live in app/layout.tsx; the inline theme /
// showSection / sendToWhatsapp scripts were ported with it, and
// index.html:916 (`js/app.js`) no longer exists.
//
// Three things this file must NOT contain, because layout.tsx:127 already
// wraps {children} in <PortfolioProvider> (a second one would double-fetch),
// Hero.tsx:12 already returns <main> as its own root (a wrapper would give
// the page two <main> elements), and About.tsx:66 already renders <Skills />:
// no <PortfolioProvider>, no <main> wrapper, no <Skills />.
import { DesignLightboxProvider } from '@/lib/designLightbox';
import Navbar from '@/components/site/Navbar';
import SeoUpdater from '@/components/site/SeoUpdater';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import Work from '@/components/sections/Work';
import Journey from '@/components/sections/Journey';
import Contact from '@/components/sections/Contact';
import Faq from '@/components/sections/Faq';
import DesignLightbox from '@/components/work/DesignLightbox';
import Footer from '@/components/site/Footer';
import FloatingActions from '@/components/site/FloatingActions';

// Faq stays a server component (no 'use client'): importing it from this
// server component keeps its zero-JavaScript behaviour. Every other child
// below is a client component; DesignLightboxProvider is the only provider
// added here (useDesignLightbox() throws outside it).
export default function Page() {
  return (
    <DesignLightboxProvider>
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Work />
      <Journey />
      <Contact />
      <Faq />
      <DesignLightbox />
      <Footer />
      <FloatingActions />
      <SeoUpdater />
    </DesignLightboxProvider>
  );
}
