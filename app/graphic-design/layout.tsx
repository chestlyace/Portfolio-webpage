{/* graphic-design.html:1-4, 5-71, 73 — <head> block and the <body>
    open tag, transcribed verbatim. The source exports no metadata and
    imports no stylesheet of its own; line 70's Tailwind CDN script is the
    only styling hook it has, so this layout emits nothing else. */}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>Graphic Design Services | Chestly Ace (Amahndong Chestly)</title>
        <meta name="description"
          content="Hire Chestly Ace, also known as Amahndong Chestly, for graphic design services including brand visuals, social media graphics, promotional designs, and creative digital assets." />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Chestly Ace (Amahndong Chestly)" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="canonical" href="https://chestlyace.online/graphic-design.html" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Graphic Design Services | Chestly Ace (Amahndong Chestly)" />
        <meta property="og:description"
          content="Graphic design services by Chestly Ace for branding, social media visuals, marketing graphics, and creative campaigns." />
        <meta property="og:url" content="https://chestlyace.online/graphic-design.html" />
        <meta property="og:image" content="https://chestlyace.online/assets/og/graphic-design-og.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Graphic Design Services | Chestly Ace" />
        <meta name="twitter:description"
          content="Graphic design services by Chestly Ace for branding, social media visuals, marketing graphics, and creative campaigns." />
        <meta name="twitter:image" content="https://chestlyace.online/assets/og/graphic-design-og.webp" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          "@id": "https://chestlyace.online/graphic-design.html#service",
          "name": "Graphic Design Services",
          "serviceType": "Graphic design",
          "provider": {
            "@type": "Person",
            "name": "Chestly Ace",
            "alternateName": [
              "Amahndong Chestly",
              "Chestly Amahndong"
            ],
            "url": "https://chestlyace.online/"
          },
          "url": "https://chestlyace.online/graphic-design.html",
          "areaServed": "Worldwide",
          "description": "Graphic design services including branding, social media graphics, promotional visuals, and marketing assets."
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://chestlyace.online/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Graphic Design Services",
              "item": "https://chestlyace.online/graphic-design.html"
            }
          ]
        }
      ]
    }
  `,
          }}
        />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-stone-950 text-white antialiased">{children}</body>
    </html>
  );
}
