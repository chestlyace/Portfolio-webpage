// js/app.js:7-12 (`setMetaContent`) and js/app.js:31-142 (`updateSeo`),
// ported verbatim. `applySeo` keeps the source's own signature
// `updateSeo(profile, socials)` so the `if (!profile) return;` guard reads
// identically; it runs in the browser after the fetch resolves, exactly as
// js/app.js:272 does, and rewrites what the layout server-rendered.
// Everything below — write order, guards, and JSON-LD key order — must stay
// byte-identical to the source: the output is diffed against it.
import { optimizeCloudinaryImage } from './cloudinary';
import type { Profile, Social } from './types';

export function setMetaContent(selector: string, content: string): void {
  const element = document.querySelector(selector);
  if (element && content) {
    element.setAttribute('content', content);
  }
}

export function applySeo(
  profile: Profile | null,
  socials: Social[] | undefined,
): void {
  if (!profile) return;

  const name = profile.display_name || 'Chestly Ace';
  const alternateNames = ['Amahndong Chestly', 'Chestly Amahndong'];
  const roleParts = [profile.title_1, profile.title_2, profile.title_3].filter(Boolean);
  const roleText = roleParts.length
    ? roleParts.join(', ').replace(/,([^,]*)$/, ' &$1')
    : 'Software Developer, Graphic Designer & Photographer';
  const tagline = profile.tagline || 'Software developer, graphic designer, and photographer.';
  const aboutText = [profile.about_text_1, profile.about_text_2].filter(Boolean).join(' ');
  const description = `${name}, also known as Amahndong Chestly, is a ${roleText}. ${tagline} ${aboutText}`.trim().slice(0, 300);
  const pageTitle = `${name} (Amahndong Chestly) | ${roleText}`;
  const imageUrl = optimizeCloudinaryImage(profile.hero_image, { width: 1200, height: 1600, crop: 'limit' })
      || 'https://chestlyace.online/hero-optimized.webp';
  const canonicalUrl = 'https://chestlyace.online/';

  document.title = pageTitle;
  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[property="og:title"]', pageTitle);
  setMetaContent('meta[property="og:description"]', description);
  setMetaContent('meta[property="og:url"]', canonicalUrl);
  setMetaContent('meta[property="og:image"]', imageUrl);
  setMetaContent('meta[property="og:image:alt"]', `Portrait of ${name}`);
  setMetaContent('meta[name="twitter:title"]', pageTitle);
  setMetaContent('meta[name="twitter:description"]', description);
  setMetaContent('meta[name="twitter:image"]', imageUrl);

  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.setAttribute('href', canonicalUrl);
  }

  const socialUrls = Array.isArray(socials)
      ? socials.map((social) => social.url).filter(Boolean)
      : [];
  const faqEntities = Array.from(document.querySelectorAll('#faq details')).map((item) => ({
      '@type': 'Question',
      name: item.querySelector('summary')?.textContent?.trim(),
      acceptedAnswer: {
          '@type': 'Answer',
          text: item.querySelector('p')?.textContent?.trim(),
      },
  })).filter((item) => item.name && item.acceptedAnswer.text);

  const structuredData = document.getElementById('structured-data');
  if (structuredData) {
      structuredData.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
              {
                  '@type': 'WebSite',
                  '@id': `${canonicalUrl}#website`,
                  url: canonicalUrl,
                  name: `${name} Portfolio`,
                  description,
              },
              {
                  '@type': 'Person',
                  '@id': `${canonicalUrl}#person`,
                  name,
                  alternateName: alternateNames,
                  url: canonicalUrl,
                  image: imageUrl,
                  jobTitle: roleParts,
                  description,
                  email: profile.email ? `mailto:${profile.email}` : undefined,
                  telephone: profile.phone || undefined,
                  sameAs: socialUrls.length ? socialUrls : [canonicalUrl],
                  knowsAbout: [
                      'Web development',
                      'Frontend development',
                      'Backend development',
                      'Graphic design',
                      'Brand identity design',
                      'Photography',
                  ],
              },
              {
                  '@type': 'ItemList',
                  '@id': `${canonicalUrl}#services`,
                  name: 'Creative and technical services by Chestly Ace',
                  itemListElement: [
                      {
                          '@type': 'Service',
                          position: 1,
                          name: 'Software Development',
                          url: `${canonicalUrl}software-development.html`,
                      },
                      {
                          '@type': 'Service',
                          position: 2,
                          name: 'Graphic Design',
                          url: `${canonicalUrl}graphic-design.html`,
                      },
                      {
                          '@type': 'Service',
                          position: 3,
                          name: 'Photography',
                          url: `${canonicalUrl}photography.html`,
                      },
                  ],
              },
              ...(faqEntities.length ? [{
                  '@type': 'FAQPage',
                  '@id': `${canonicalUrl}#faq`,
                  mainEntity: faqEntities,
              }] : []),
          ],
      });
  }
}
