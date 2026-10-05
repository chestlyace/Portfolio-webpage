{/* photography.html:1-4, 5-71, 73 — <head> block and the <body>
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
        <title>Photography Services | Chestly Ace (Amahndong Chestly)</title>
        <meta name="description"
          content="Hire Chestly Ace, also known as Amahndong Chestly, for photography services including event coverage, portraits, branded content, and visual storytelling." />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Chestly Ace (Amahndong Chestly)" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="canonical" href="https://chestlyace.online/photography.html" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Photography Services | Chestly Ace (Amahndong Chestly)" />
        <meta property="og:description"
          content="Photography services by Chestly Ace for portraits, event coverage, branded visuals, and creative storytelling." />
        <meta property="og:url" content="https://chestlyace.online/photography.html" />
        <meta property="og:image" content="https://chestlyace.online/assets/og/photography-og.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Photography Services | Chestly Ace" />
        <meta name="twitter:description"
          content="Photography services by Chestly Ace for portraits, event coverage, branded visuals, and creative storytelling." />
        <meta name="twitter:image" content="https://chestlyace.online/assets/og/photography-og.webp" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          "@id": "https://chestlyace.online/photography.html#service",
          "name": "Photography Services",
          "serviceType": "Photography",
          "provider": {
            "@type": "Person",
            "name": "Chestly Ace",
            "alternateName": [
              "Amahndong Chestly",
              "Chestly Amahndong"
            ],
            "url": "https://chestlyace.online/"
          },
          "url": "https://chestlyace.online/photography.html",
          "areaServed": "Worldwide",
          "description": "Photography services including event coverage, portraits, creative sessions, and branded visual storytelling."
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
              "name": "Photography Services",
              "item": "https://chestlyace.online/photography.html"
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
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
