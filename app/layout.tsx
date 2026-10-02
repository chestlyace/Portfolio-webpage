import './globals.css';
import { PortfolioProvider } from '@/lib/PortfolioProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>
          Chestly Ace (Amahndong Chestly) | Software Developer, Graphic Designer
          &amp; Photographer
        </title>
        <meta
          name="description"
          content="Chestly Ace, also known as Amahndong Chestly, is a software developer, graphic designer, and photographer building modern websites, visual identities, and digital experiences for clients worldwide."
        />
        <meta
          name="keywords"
          content="Amahndong Chestly, Chestly Amahndong, Chestly Ace, Amahndong chestly portfolio, software developer portfolio, graphic designer portfolio, photographer portfolio"
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Chestly Ace (Amahndong Chestly)" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="application-name" content="Chestly Ace Portfolio" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="canonical" href="https://chestlyace.online/" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        {/* index.html:20-32: og: and twitter: tags, verbatim, same order */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Chestly Ace Portfolio" />
        <meta
          property="og:title"
          content="Chestly Ace (Amahndong Chestly) | Software Developer, Graphic Designer & Photographer"
        />
        <meta
          property="og:description"
          content="Portfolio of Chestly Ace, also known as Amahndong Chestly, featuring software development, graphic design, branding, and photography work."
        />
        <meta property="og:url" content="https://chestlyace.online/" />
        <meta
          property="og:image"
          content="https://chestlyace.online/hero-optimized.webp"
        />
        <meta property="og:image:alt" content="Portrait of Chestly Ace" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Chestly Ace (Amahndong Chestly) | Software Developer, Graphic Designer & Photographer"
        />
        <meta
          name="twitter:description"
          content="Portfolio of Chestly Ace, also known as Amahndong Chestly, featuring web development, graphic design, branding, and photography."
        />
        <meta
          name="twitter:image"
          content="https://chestlyace.online/hero-optimized.webp"
        />
        {/* index.html:77-87 */}
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link href="https://cdnjs.cloudflare.com" rel="preconnect" />
        <link href="https://cdn.jsdelivr.net" rel="preconnect" />
        {/* The preload attributes are spread with lowercase keys to satisfy
            @types/react, which only declares the camelCase spellings, and to
            keep the emitted DOM attribute lowercase. React normalises
            camelCase to lowercase anyway, so `imageSrcSet` would emit
            `imagesrcset` too — either spelling works; this form keeps the
            types and the output correct at once. */}
        <link
          rel="preload"
          as="image"
          href="/hero-optimized.webp"
          {...{
            imagesrcset: '/hero-optimized.webp 1200w',
            imagesizes: '(min-width: 1024px) 40vw, 100vw',
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&amp;family=Inter:wght@300;400;500;600;700&amp;family=Outfit:wght@300;400;600;800&amp;display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
        {/* Theme initialisation — index.html:851-864, init half only. Runs
            before first paint so dark mode never flashes white. React must
            never read localStorage.theme during render. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==="dark"||(!("theme" in localStorage)&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}`,
          }}
        />
        {/* Placeholder until Task 18 writes the live updateSeo() payload. */}
        <script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: '{}' }}
        />
      </head>
      <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-body antialiased transition-colors duration-300 relative overflow-x-hidden">
        <div className="absolute inset-0 w-full h-full text-black dark:text-white pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-swirl-pattern z-0" />
        <PortfolioProvider>{children}</PortfolioProvider>
      </body>
    </html>
  );
}
