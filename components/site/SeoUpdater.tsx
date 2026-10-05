'use client';

import { useEffect } from 'react';
import { usePortfolio } from '@/lib/PortfolioProvider';
import { applySeo } from '@/lib/seo';

// js/app.js:272 — `updateSeo(data.profile, data.socials)` immediately after
// the portfolio fetch resolves. Here the same rewrite happens in an effect
// once the context carries data; nothing is read during render, so server
// and client render the same tree and the layout's pre-fetch tags are what
// a crawler sees before hydration. Renders null, so its position in
// app/page.tsx never affects the DOM, and app/page.tsx can stay a server
// component. Next's Metadata API is deliberately not used: these tags are
// rewritten in the browser exactly as they are today.
export default function SeoUpdater() {
  const { data } = usePortfolio();
  useEffect(() => {
    if (data) applySeo(data.profile, data.socials);
  }, [data]);
  return null;
}
