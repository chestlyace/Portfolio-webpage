# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the four-page static Tailwind-CDN portfolio to Next.js 16 + TypeScript with a strict zero-visual-difference result, verified by the user in a browser at each of 18 checkpoints.

**Architecture:** `next build` with `output: 'export'` emits static HTML/CSS/JS into `out/`, which nginx already serves unchanged. All content stays DB-driven: one client-side fetch of `/api/portfolio` feeds a shared provider, and every section renders today's literal placeholder HTML until data arrives, then swaps to the data-driven version. `/admin/` stays static and is copied separately.

**Tech Stack:** Next.js 16.3.8, React 19, TypeScript, Tailwind CSS 3.4 + PostCSS, `@tailwindcss/forms`, `@tailwindcss/typography`

**Spec:** `docs/superpowers/specs/2026-10-02-nextjs-migration-design.md` — read it before starting. The plan argues from the spec; the spec travels with it.

## Deviation from TDD — stated, not hidden

This plan does **not** use test-driven development, because this repository has no test
framework and the user chose browser review as the acceptance oracle (spec Q6). Adding
a test framework is explicitly out of scope. Each task therefore ends with a **Verify**
step that is a real command plus a browser comparison against the baseline, and the
user gates the next task. `npm test` still exits 1 by design. Do not introduce a test
runner; that would be an unrequested change.

## Global Constraints

Copied verbatim from the spec. Every task implicitly includes this section.

- **Zero visual difference.** Same URLs, same DOM, same computed styles, same
  interaction behaviour. "Close enough" is a failure.
- **Only four intentional differences exist.** Anything else that changes is a bug:
  1. On `localhost`, dev reads the live API instead of `localhost:5000`.
  2. The `js/app.js?v=…` cache-bust query is gone; Next fingerprints assets.
  3. CSS arrives via `<link>` instead of runtime injection by the CDN.
  4. `check-assets.mjs` audits build output instead of HTML sources.
- **Seven classes must stay no-ops and must never be given a definition:**
  `bg-grid-pattern`, `light-glass-panel`, `card-hover`, `glass-border`,
  `surface-dark`, `shadow-glow`, `ml--10`. The last one is a misspelling of `-ml-10`
  and applies nothing today; "repairing" it shifts the work header left by 2.5rem.
- **`@tailwind` directives first, custom CSS second, never inside `@layer`.** Today the
  CDN `<script>` precedes the `<style>` block, so custom CSS wins ties.
- **Theme init runs as a `<script>` in `<head>`, never `useEffect`.** Never read
  `localStorage.theme` during render — that causes a hydration mismatch which makes
  React discard the server markup and destroys the theme script's DOM change,
  reintroducing the FOUC.
- **All internal links are plain `<a>` tags. Never `<Link>`.** Required for anchor
  behaviour on `/#work` and required for the payload-litter deletion to be safe.
- **No `next/image`.** Every image is a plain `<img>` with `loading="lazy"` and
  `decoding="async"`, exactly as `js/app.js` emits them.
- **Dynamic SEO stays imperative.** Next's Metadata API is not used for the runtime
  tags; it would server-render them and change what a crawler reads.
- **Two pre-existing quirks are deliberately not fixed:** `window.open(url,'_blank').focus()`
  throws when the popup is blocked; `alert()` fires on an empty contact form.
- **Zero `event`-type works exist in the database.** The EVENTS tab renders empty in
  production today and must continue to. This is not a bug to fix.
- **`/admin/` is not migrated.** It keeps its `noindex` meta and `robots.txt` rule.
- **Do not touch** `backend/`, `db/`, the nginx config, or `backend/.env`.
- **npm is slow here** — a `next` + `react` install took ~12 minutes. Run installs in
  the background and do not treat a slow install as a hang.

## Source Map

`index.html` and `js/app.js` are the migration source of truth and are **not deleted
until Task 18**. Every task below names the exact line range it transcribes. Read that
range; do not work from memory of it.

| `index.html` | Contents | Task |
|---|---|---|
| 1-32 | `<title>`, description, OG, Twitter, favicons, canonical, sitemap link | 2 |
| 33-76 | `<script id="structured-data">` ld+json | 2 |
| 77-87 | 4 preconnects, hero preload, 3 font/icon stylesheets | 2 |
| 88-119 | Tailwind CDN + inline `tailwind.config` | 1 |
| 120-239 | `<style>` block, 14 selectors | 1 |
| 240-244 | `<body>` classes + swirl overlay div | 2 |
| 245-272 | Navbar | 3 |
| 273-385 | Hero (`<main>`) | 4 |
| 386-433 | About: heading, quote, paragraphs, resume link, "My Arsenal", soft-skill pills | 5 |
| 434-473 | Skills: three grids | 6 |
| 475-491 | Services | 7 |
| 492-523 | Work header + three category buttons | 8 |
| 524-528 | `#projects-section` | 9 |
| 529-535 | `#design-section` + `.masonry-gallery` | 10 |
| 536-540 | `#events-section` | 11 |
| 541-563 | Journey timeline | 13 |
| 564-618 | Contact left column | 14 |
| 619-662 | Contact `<form>` | 15 |
| 666-713 | FAQ `<details>` list | 16 |
| 714-767 | Design lightbox | 12 |
| 768-837 | Footer | 17 |
| 838-850 | Floating actions (WhatsApp + theme toggle) | 17 |
| 851-915 | Inline scripts: theme init, `showSection`, `sendToWhatsapp` | 2, 8, 15 |
| 916-919 | `js/app.js` script tag | 18 |

| `js/app.js` | Contents | Task |
|---|---|---|
| 7-12 | `setMetaContent` | 18 |
| 14-29 | `optimizeCloudinaryImage` | 1 |
| 31-142 | `updateSeo` | 18 |
| 144-150 | `getServiceLink` | 7 |
| 152-154 | `getDesignMetaText` | 10 |
| 156-262 | Lightbox: content, open, close, next, keyboard, touch | 12 |
| 263-278 | `fetchPortfolioData` | 1 |
| 280-304 | `renderProfile` | 2, 4, 5, 14, 15 |
| 306-328 | `renderSkills` | 6 |
| 330-365 | `renderServices` | 7 |
| 367-477 | `renderWorks` — project 384-417, design 418-439, event 440-477 | 9, 10, 11 |
| 479-517 | `renderJourney` | 13 |
| 519-540 | `renderSocials` | 3, 14, 17 |

`backend/server.js:153` defines `GET /api/portfolio`, the single endpoint consumed.

## Live API shape (verified 2026-10-02 against the production API)

```
{ profile, skills[29], services[4], works[25], journey[9], socials[4] }
```

Field names — note `journey` uses `role`/`company`/`dates`, **not**
`title`/`organization`/`period`:

| Entity | Fields |
|---|---|
| `profile` | `id, name, display_name, title_1, title_2, title_3, tagline, hero_image, about_quote, about_text_1, about_text_2, resume_url, phone, email, whatsapp_number` |
| `skills` | `id, name, icon, category` |
| `services` | `id, title, description, icon, items` (`items` = `string[]`) |
| `works` | `id, type, title, description, image_url, tech_stack[], live_url, source_url, category_label, highlights[], design_tool, client_name, is_live_url_private, is_source_url_private` |
| `journey` | `id, role, company, dates, description, logo_url, type, order_index` |
| `socials` | `id, platform, url, icon` |

## Review workflow

Two servers, two tabs, same live data:

```bash
# once, before Task 1
git checkout feature/nextjs-migration
git reset --hard main          # the branch is 17 commits behind main
git worktree add ../portfolio-baseline main
cd ../portfolio-baseline && npm install && npm run dev -- --port 3000
# in the main worktree
npm run dev -- --port 3001
```

Baseline is `http://localhost:3000`, new site is `http://localhost:3001`.

---

### Task 1: Scaffold the Next.js app with the Tailwind config, global CSS, and data foundation

Establishes the build, the design tokens, and the shared data layer. Every later task
depends on it, so it is folded together rather than split.

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `app/globals.css`
- Create: `lib/types.ts`
- Create: `lib/cloudinary.ts`
- Create: `lib/api.ts`
- Create: `lib/PortfolioProvider.tsx`
- Create: `components/ui/SectionBoundary.tsx`
- Create: `scripts/finalize-export.mjs`
- Read (do not modify): `index.html:88-119`, `index.html:120-239`, `js/app.js:14-29`, `js/app.js:263-278`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `lib/types.ts` → `Profile`, `Skill`, `Service`, `Work`, `WorkType`, `JourneyItem`, `Social`, `PortfolioData`
  - `lib/cloudinary.ts` → `optimizeCloudinaryImage(url: string, options?: { width?: number; height?: number; crop?: string }): string`
  - `lib/api.ts` → `API_URL: string`, `fetchPortfolio(): Promise<PortfolioData>`
  - `lib/PortfolioProvider.tsx` → `usePortfolio(): PortfolioState`, `PortfolioProvider({ children }: { children: React.ReactNode })`
  - `PortfolioState` → `{ data: PortfolioData | null; error: Error | null }`
  - `components/ui/SectionBoundary.tsx` → `SectionBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode })`
  - `tailwind.config.ts` → default export consumed by PostCSS automatically

- [ ] **Step 1: Install dependencies (background — this takes ~12 min)**

```bash
npm install next@16 react@19 react-dom@19
npm install -D typescript @types/react @types/react-dom @types/node \
  tailwindcss@3.4 postcss autoprefixer @tailwindcss/forms @tailwindcss/typography
```

Run in the background and continue only once it finishes. Do not edit files it is
still writing.

- [ ] **Step 2: Add `.next/`, `out/`, `next-env.d.ts` to `.gitignore`**

Keep the existing entries (`node_modules`, `.env`, `.superpowers/`). Append only.

- [ ] **Step 3: Replace the scripts block in `package.json`**

```json
"scripts": {
  "dev": "next dev --port 3001",
  "build": "next build && node scripts/finalize-export.mjs && node scripts/check-assets.mjs",
  "start": "next start",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

`build` chains the export finalizer and the asset check so neither can be skipped.
Leave `"test"` exactly as it is — it exits 1 by design and that is out of scope to change.

- [ ] **Step 4: Create `next.config.mjs`**

```js
export default {
  output: 'export',
  trailingSlash: false,
};
```

No `images` key: the project uses no `next/image`. No rewrites: nginx has no rewrite
layer and needs none.

- [ ] **Step 5: Create `postcss.config.mjs`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create `tailwind.config.ts` by transcribing `index.html:89-118` verbatim**

Transcribe every key. The critical values, which must be character-identical:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#10B981',
        'background-light': '#F8FAFC',
        'background-dark': '#0a0a0a',
        'card-light': '#FFFFFF',
        'card-dark': '#171717',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        sans: ['"Outfit"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
      backgroundImage: {
        'swirl-pattern':
          "url('data:image/svg+xml,%3Csvg width=\\'100%\\' height=\\'100%\\' viewBox=\\'0 0 800 400\\' xmlns=\\'http://www.w3.org/2000/svg\\' opacity=\\'0.05\\'%3E%3Cpath d=\\'M250,100 Q400,0 550,100 T850,100\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'/%3E%3Cpath d=\\'M-50,200 Q150,100 350,200 T750,200\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'/%3E%3Cpath d=\\'M150,300 Q300,200 450,300 T850,300\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'/%3E%3C/svg%3E')",
      },
    },
  },
};

export default config;
```

The `swirl-pattern` value is copied byte-for-byte from `index.html:114-117` including
every `\\'` escape. Do not "clean up" the escaping — it will break the data URI.

`content` is an addition the CDN did not need, because the CDN scans the DOM at
runtime. It is required for a build-time compile.

- [ ] **Step 7: Create `app/globals.css` — directives first, then the style block**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Verbatim from index.html:120-239. Order relative to the @tailwind
   directives above is load-bearing: today the CDN <script> precedes the
   <style> block, so these rules win ties. Do not wrap in @layer. */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.text-outline {
  -webkit-text-stroke: 1px currentColor;
  color: transparent;
}

.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-light {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.sticker {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sticker:hover {
  transform: scale(1.1) rotate(5deg);
  z-index: 20;
}

.glass-card {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.timeline-line {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  bottom: 0;
  width: 2px;
}

@media (max-width: 768px) {
  .timeline-line {
    left: 2rem;
  }
}

.bg-swirl {
  background-color: transparent;
  background-image: radial-gradient(at 40% 20%, hsla(0, 0%, 100%, 0.1) 0px, transparent 50%),
    radial-gradient(at 80% 0%, hsla(0, 0%, 100%, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(0, 0%, 100%, 0.1) 0px, transparent 50%);
}

.dark .bg-swirl {
  background-image: radial-gradient(at 40% 20%, hsla(0, 0%, 20%, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 0%, hsla(0, 0%, 20%, 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(0, 0%, 20%, 0.3) 0px, transparent 50%);
}

.glass-panel {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.defer-section {
  content-visibility: auto;
  contain-intrinsic-size: 1px 1000px;
}

.masonry-gallery {
  column-count: 2;
  column-gap: 1.5rem;
}

.masonry-item {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .masonry-gallery {
    column-count: 3;
  }
}

@media (min-width: 1024px) {
  .masonry-gallery {
    column-count: 4;
  }
}

@media (min-width: 1280px) {
  .masonry-gallery {
    column-count: 5;
  }
}

.lightbox-open {
  overflow: hidden;
}
```

Fourteen selectors. `.sr-only` duplicates Tailwind's own utility with identical
declarations — that duplication exists today and is preserved deliberately.

- [ ] **Step 8: Create `lib/types.ts`**

```ts
export interface Profile {
  id: number;
  name: string;
  display_name: string;
  title_1: string;
  title_2: string;
  title_3: string;
  tagline: string;
  hero_image: string;
  about_quote: string;
  about_text_1: string;
  about_text_2: string;
  resume_url: string;
  phone: string;
  email: string;
  whatsapp_number: string;
}

export interface Skill {
  id: number;
  name: string;
  icon: string;
  category: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  items: string[];
}

export type WorkType = 'project' | 'design' | 'event';

export interface Work {
  id: number;
  type: WorkType;
  title: string;
  description: string;
  image_url: string;
  tech_stack: string[];
  live_url: string | null;
  source_url: string | null;
  category_label: string | null;
  highlights: string[];
  design_tool: string | null;
  client_name: string | null;
  is_live_url_private: boolean | null;
  is_source_url_private: boolean | null;
}

export interface JourneyItem {
  id: number;
  role: string;
  company: string;
  dates: string;
  description: string;
  logo_url: string | null;
  type: string;
  order_index: number;
}

export interface Social {
  id: number;
  platform: string;
  url: string;
  icon: string;
}

export interface PortfolioData {
  profile: Profile | null;
  skills: Skill[];
  services: Service[];
  works: Work[];
  journey: JourneyItem[];
  socials: Social[];
}
```

`portfolio` is nullable because `renderProfile` guards on it today
(`js/app.js:281`), and `updateSeo` guards too (`js/app.js:32`).

- [ ] **Step 9: Create `lib/cloudinary.ts` — a line-for-line port of `js/app.js:14-29`**

```ts
export interface CloudinaryOptions {
  width?: number;
  height?: number;
  crop?: string;
}

export function optimizeCloudinaryImage(
  url: string,
  options: CloudinaryOptions = {},
): string {
  if (!url || !url.includes('/image/upload/')) {
    return url;
  }

  const transforms = ['f_auto', 'q_auto:good'];

  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);

  return url.replace('/image/upload/', `/image/upload/${transforms.join(',')}/`);
}
```

The early return is load-bearing: bare local paths like `resume.pdf` and
`digimark.jpeg` contain no `/image/upload/` and must pass through untouched.

- [ ] **Step 10: Create `lib/api.ts`**

```ts
import type { PortfolioData } from './types';

function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured;

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // Dev only: there is no runnable local API. backend/.env on the dev
    // machine still points at a dead Neon host and the local Postgres
    // rejects portfolio_user. This branch is read-only and never mutates.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://chestlyace.online/api';
    }
  }

  // Production: same-origin, proxied by nginx to 127.0.0.1:5000.
  return '/api';
}

export const API_URL = resolveApiUrl();

export async function fetchPortfolio(): Promise<PortfolioData> {
  const response = await fetch(`${API_URL}/portfolio`);
  if (!response.ok) {
    throw new Error(`Portfolio request failed: ${response.status}`);
  }
  return (await response.json()) as PortfolioData;
}
```

The `typeof window` guard matters: this module is evaluated during prerender, where
`window` is undefined and the function must fall through to `/api`.

- [ ] **Step 11: Create `lib/PortfolioProvider.tsx`**

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { fetchPortfolio } from './api';
import type { PortfolioData } from './types';

export interface PortfolioState {
  data: PortfolioData | null;
  error: Error | null;
}

const PortfolioContext = createContext<PortfolioState>({
  data: null,
  error: null,
});

export function usePortfolio(): PortfolioState {
  return useContext(PortfolioContext);
}

export function PortfolioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<PortfolioState>({
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio()
      .then((data) => {
        if (!cancelled) setState({ data, error: null });
      })
      .catch((error: Error) => {
        // Matches js/app.js:276 — log and leave every section on its
        // placeholder markup rather than blanking the page.
        console.error('Error fetching portfolio data:', error);
        if (!cancelled) setState({ data: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PortfolioContext.Provider value={state}>
      {children}
    </PortfolioContext.Provider>
  );
}
```

State starts `null` on both server and first client render, so React hydrates a
matching tree. This is what makes pre-fetch DOM invariance hold.

- [ ] **Step 12: Create `components/ui/SectionBoundary.tsx`**

```tsx
'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  failed: boolean;
}

export class SectionBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    console.error('Section failed, showing placeholder:', error);
  }

  render(): ReactNode {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
```

A class component because that is the only error-boundary API React offers. `fallback`
is the section's placeholder markup, so a throw degrades one section instead of the
page — this is what `js/app.js:275-277`'s `catch` does today.

- [ ] **Step 13: Create a minimal `app/layout.tsx` and `app/page.tsx`**

`app/layout.tsx` for now, so the build has an entry point. Task 2 replaces it with the
real one. It must import the stylesheet or nothing will be styled:

```tsx
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx`:

```tsx
export default function Page() {
  return <main>Scaffold placeholder — replaced in Task 2.</main>;
}
```

- [ ] **Step 14: Create `scripts/finalize-export.mjs`**

```js
#!/usr/bin/env node
/**
 * Post-process the Next.js static export.
 *
 * Two jobs:
 *
 *  1. Assert the four expected documents exist. A clean segment name
 *     (`app/graphic-design/`) makes Next emit `out/graphic-design.html`,
 *     which nginx serves at the existing URL with no rewrite. Verified
 *     empirically against Next 16.3.8. If that ever stops being true this
 *     script fails loudly instead of publishing a 404.
 *
 *  2. Delete the RSC payload litter (`out/*.txt`, `out/__next.*.txt`,
 *     `out/<route>/`). Verified safe: all pages still hydrate and log zero
 *     console errors without it, because every internal link is a plain
 *     <a> tag and never <Link>. Step 3 is what makes step 2 safe to run
 *     automatically rather than on trust.
 */
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(REPO_ROOT, 'out');

const REQUIRED = [
  'index.html',
  'graphic-design.html',
  'photography.html',
  'software-development.html',
];

if (!existsSync(OUT)) {
  console.error('FAIL: out/ does not exist — run `next build` first.');
  process.exit(1);
}

const missing = REQUIRED.filter((f) => !existsSync(join(OUT, f)));
if (missing.length) {
  console.error(
    `FAIL: expected export documents are missing:\n${missing
      .map((m) => `  out/${m}`)
      .join('\n')}\n` +
      'If a route was named `graphic-design.html`, Next emits ' +
      '`graphic-design.html.html` AND a colliding payload directory. ' +
      'The route folder must be named `graphic-design` with no extension.',
  );
  process.exit(1);
}

// --- Delete the payload litter. ---
const removed = [];

function isPayloadFile(name) {
  return name.endsWith('.txt');
}

function isPayloadDir(name) {
  if (name === '_next' || name === '404.html' || name === '_not-found.html') {
    return false;
  }
  // Payload dirs are named after their route and contain only __next.*.txt
  // files. Route directories never do, because routes emit .html files.
  const full = join(OUT, name);
  if (!statSync(full).isDirectory()) return false;
  const entries = readdirSync(full);
  return (
    entries.length > 0 && entries.every((e) => e.startsWith('__next.'))
  );
}

for (const entry of readdirSync(OUT)) {
  const full = join(OUT, entry);
  if (isPayloadDir(entry) || isPayloadFile(entry)) {
    rmSync(full, { recursive: true, force: true });
    removed.push(entry);
  }
}

// --- Prove the deletion was safe: no surviving file may reference a
// --- removed path. Fail loudly rather than publish a broken reference.
const dangling = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(html|js|css|json|txt)$/.test(entry)) continue;
    const body = readFileSync(full, 'utf8');
    for (const gone of removed) {
      if (body.includes(`/${gone}`) || body.includes(`"${gone}"`)) {
        dangling.push(`${full.replace(`${REPO_ROOT}/`, '')} references ${gone}`);
      }
    }
  }
}
walk(OUT);

if (dangling.length) {
  console.error(
    `FAIL: ${dangling.length} file(s) reference deleted export payloads:\n` +
      dangling.map((d) => `  ${d}`).join('\n') +
      '\nEither internal navigation started using <Link>, or a payload is ' +
      'actually needed. Restore it rather than publishing.',
  );
  process.exit(1);
}

console.log(`OK: ${REQUIRED.length} export documents present`);
console.log(`OK: removed ${removed.length} payload artifact(s): ${removed.join(', ') || 'none'}`);
console.log('OK: no surviving reference to a removed artifact');
```

- [ ] **Step 15: Create `app/page.tsx` route placeholders for the three subpages**

Not their real content — Task 18 does that. They exist so the build emits the four
documents `finalize-export.mjs` asserts on.

```tsx
// app/graphic-design/page.tsx
export default function Page() {
  return <main>Placeholder — replaced in Task 18.</main>;
}
```

Repeat at `app/photography/page.tsx` and `app/software-development/page.tsx`.

**Folder names carry no `.html` suffix.** Next appends `.html` when exporting, and a
folder named `graphic-design.html` produces both `graphic-design.html.html` and a
payload directory that collides with it.

- [ ] **Step 16: Run the build**

```bash
npm run build
```

Expected: build succeeds, then
`OK: 4 export documents present`, then `OK: removed N payload artifact(s)`, then
`OK: no surviving reference to a removed artifact`.

`check-assets.mjs` still passes here because it is unmodified and its `SOURCES` files
all still exist. Task 18 retargets it.

- [ ] **Step 17: Verify the export**

```bash
ls out/
```

Expected exactly: `404.html`, `_next/`, `graphic-design.html`, `index.html`,
`photography.html`, `software-development.html`, `_not-found.html` — no `.txt` files,
no route-named directories, and no `out/` subdirectory.

- [ ] **Step 18: Confirm the dev server renders**

Start `npm run dev` (port 3001). The scaffold placeholder page appears with Tailwind
styles applied — check that `<h1>` is unstyled-serif reset, or more practically that
the page has no unstyled Times New Roman. If CSS is not applied, the `globals.css`
import in `app/layout.tsx` is missing.

**Verify:** `http://localhost:3001` loads with Tailwind's preflight active. Nothing
else to compare yet — this task produces no visible site content.

**Commit:**
```bash
git add -A package.json package-lock.json .gitignore next.config.mjs postcss.config.mjs \
  tailwind.config.ts app/globals.css app/layout.tsx app/page.tsx app/*/page.tsx \
  lib/ components/ scripts/finalize-export.mjs
git commit -m "feat: scaffold Next.js export with Tailwind 3.4 and the data layer"
```

---

### Task 2: Root layout — head, fonts, preload, body classes, theme initialisation

**Files:**
- Modify: `app/layout.tsx`
- Read: `index.html:1-87`, `index.html:240-244`, `index.html:851-874`

**Interfaces:**
- Consumes: `PortfolioProvider` from `lib/PortfolioProvider`; `globals.css` from Task 1.
- Produces: default-exported `RootLayout` — the document shell every section renders inside.

- [ ] **Step 1: Transcribe the static head from `index.html:1-32` and `77-87`**

Copy the tags in this order into the layout:

```tsx
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chestly Ace (Amahndong Chestly) | Software Developer, Graphic Designer &amp; Photographer</title>
  <meta name="description" content="…index.html:5-6 verbatim…" />
  {/* index.html:19-32: og: and twitter: tags, verbatim, same order */}
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="canonical" href="https://chestlyace.online/" />
  <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
  <link href="https://fonts.googleapis.com" rel="preconnect" />
  <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
  <link href="https://cdnjs.cloudflare.com" rel="preconnect" />
  <link href="https://cdn.jsdelivr.net" rel="preconnect" />
  <link
    rel="preload"
    as="image"
    href="/hero-optimized.webp"
    imagesrcset="/hero-optimized.webp 1200w"
    imagesizes="(min-width: 1024px) 40vw, 100vw"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Bebas+Neue&amp;family=Inter:wght@300;400;500;600;700&amp;family=Outfit:wght@300;400;600;800&amp;display=swap"
    rel="stylesheet"
  />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
</head>
```

`crossorigin=""` in JSX is `crossOrigin=""`. `&amp;` stays escaped inside the
`css2` URL. Do **not** self-host the fonts or bundle FontAwesome — that changes what
renders.

- [ ] **Step 2: Copy the favicons and pinned root assets into `public/`**

```bash
mkdir -p public
cp favicon.ico favicon-32x32.png apple-touch-icon.png robots.txt sitemap.xml public/
cp hero-optimized.webp "684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png" resume.pdf public/
cp logoNGcodeX.png yibs.png digimark.jpeg ets_nhahealthtech_logo.jpeg public/
cp -a assets public/assets
```

`public/` maps to the site root 1:1, so every URL survives. Do not move these files
out of the repo root conceptually — the bare filenames are what
`profile.resume_url`, `profile.hero_image`, and the `journey.logo_url` seed rows
resolve against.

- [ ] **Step 3: Transcribe the `<body>` classes and swirl overlay from `index.html:240-244`**

```tsx
<body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-body antialiased transition-colors duration-300 relative overflow-x-hidden">
  <div className="absolute inset-0 w-full h-full text-black dark:text-white pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-swirl-pattern z-0" />
  {children}
</body>
```

`bg-swirl-pattern` is real — it comes from the config's `backgroundImage`. It is not
one of the seven no-ops.

- [ ] **Step 4: Add the theme-initialisation script to `<head>`**

This must be a `<script>` in `<head>`, never a `useEffect`. It runs before first
paint; an effect runs after and produces a white flash on every dark-mode reload.
Transcribed from `index.html:852-869`:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `try{if(localStorage.theme==="dark"||(!("theme" in localStorage)&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}`,
  }}
/>
```

The init half only — the click handler stays on the toggle button in Task 17, where
the button element actually exists. React must never read `localStorage.theme` during
render; that would mismatch the server HTML and make React discard the markup this
script just set up.

- [ ] **Step 5: Copy the ld+json placeholder from `index.html:33-76`**

```tsx
<script
  id="structured-data"
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: '{}' }}
/>
```

Task 18 replaces the contents with the live `updateSeo()` payload. Emitting `{}` now
keeps the element present and addressable without pretending to ship static values
that data will overwrite.

- [ ] **Step 6: Wrap children in the provider**

```tsx
import { PortfolioProvider } from '@/lib/PortfolioProvider';
```

Apply `<PortfolioProvider>` around `{children}` inside `<body>`.

- [ ] **Step 7: Add the path alias**

`tsconfig.json` is generated by `next build`; add to it:

```json
{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }
```

Confirm `baseUrl` is `"."` so `@/lib/...` resolves.

- [ ] **Step 8: Diff the emitted `<head>` against the source**

```bash
npm run build >/dev/null 2>&1
curl -s localhost:3001 -o /dev/null || true
grep -o '<link[^>]*>' out/index.html | sed 's/ crossorigin=/ crossOrigin=/' | sort > /tmp/new-head.txt
grep -o '<link[^>]*>' index.html | sort > /tmp/old-head.txt
diff /tmp/old-head.txt /tmp/new-head.txt
```

Expect only `/_next/static/*.css` (the new stylesheet) and any reordered
`charSet`/`viewport`. Every `fonts.googleapis.com`, `cdnjs`, `favicon`, `canonical`,
and `sitemap` line must match exactly.

**Verify:** on `http://localhost:3001`, hard-reload with dark mode active
(`localStorage.theme = "dark"`) and confirm **no white flash**. Compare the swirl
overlay and body background against `:3000`. The font families should be Bebas Neue,
Inter, and Outfit — check DevTools → Computed → font-family on the `<body>`.

**Commit:**
```bash
git add app/layout.tsx public/ tsconfig.json
git commit -m "feat: add root layout with fonts, preload, and theme initialisation"
```

---

### Task 3: Navbar

**Files:**
- Create: `components/site/Navbar.tsx`
- Read: `index.html:245-272`, `js/app.js:519-540` (the `footer .flex.space-x-4` /
  navbar social nodes)

**Interfaces:**
- Consumes: `usePortfolio()`.
- Produces: default-exported `Navbar` client component.

- [ ] **Step 1: Transcribe `index.html:245-272` into `components/site/Navbar.tsx`**

Add `'use client'` at the top. Structure:

```tsx
'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';

export default function Navbar() {
  const { data } = usePortfolio();
  const profile = data?.profile ?? null;
  // ...
}
```

The nav is a fixed `<nav class="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-center">`
wrapping `.glass-light.dark:glass`. Keep that outer element and every class string
exactly.

- [ ] **Step 2: Bind the dynamic values from `js/app.js:519-540`**

- `.profile-name` → `profile.display_name`. It is a **NodeList** in the original — the
  navbar and the footer each have one. Both must receive the value.
- `.profile-name` appears in a `font-display` heading; the DB `display_name` overwrites
  the static HTML at runtime today. Render `profile?.display_name ?? <static text from
  index.html>` so the pre-fetch markup matches.
- `.contact-email` and `.contact-phone` do **not** appear in the navbar; only the name
  and, if present, social links. Read `index.html:245-272` and bind exactly what is
  there — do not add elements the source does not have.

- [ ] **Step 3: Preserve the icon spans verbatim**

Material icons render as `<span class="material-icons-outlined text-sm">menu</span>`.
Do not replace with an icon component.

**Verify:** `:3001` shows a fixed pill nav with the logo area, the name, and the
hamburger. Scroll down 200px and confirm it stays fixed. Compare against `:3000` at
the same scroll position and window width.

**Commit:**
```bash
git add components/site/Navbar.tsx
git commit -m "feat: migrate navbar"
```

---

### Task 4: Hero

**Files:**
- Create: `components/sections/Hero.tsx`
- Read: `index.html:273-385`, `js/app.js:280-291`

**Interfaces:**
- Consumes: `usePortfolio()`.
- Produces: default-exported `Hero` client component.

- [ ] **Step 1: Transcribe `index.html:273-385`**

The `<main>` element carries `bg-grid-pattern` — one of the seven no-ops. Copy it
verbatim; do not define it and do not substitute a grid utility.

Keep the `pt-24 pb-12` spacing exactly; it is what clears the fixed navbar.

- [ ] **Step 2: Bind the five dynamic values from `js/app.js:283-290`**

```tsx
<h1 className="hero-title-1">{profile?.title_1 ?? 'SOFTWARE'}</h1>
<h2 className="hero-title-2">{profile?.title_2 ?? 'DEVELOPER'}</h2>
<h3 className="hero-title-3">&amp; {profile?.title_3 ?? 'PHOTOGRAPHER'}</h3>
<p className="hero-tagline">{profile?.tagline ?? 'Open to Remote Roles'}</p>
```

`.hero-title-3` is set by `js/app.js:285` to `` `& ${profile.title_3}` `` — the ampersand
is part of the rendered text, so it must be present in both the placeholder and the
data version or the text jumps on load.

The static fallbacks are the literal text in `index.html:280-350`. Use those exact
strings, not guesses.

- [ ] **Step 3: Bind the hero image from `js/app.js:286-290`**

```tsx
<img
  className="hero-image"
  src={optimizeCloudinaryImage(profile?.hero_image ?? '', {
    width: 1200,
    height: 1600,
    crop: 'limit',
  }) || 'hero-optimized.webp'}
  alt=""
  decoding="async"
/>
```

`optimizeCloudinaryImage` returns `''` for an empty input, so the `||` fallback fires
exactly as `js/app.js:290` does. Plain `<img>`, no `next/image`, no `<Image>` wrapper.

- [ ] **Step 4: Preserve the scroll-down indicator**

`index.html:383` has a `keyboard_arrow_down` material icon. Keep it static.

**Verify:** on `:3001` the hero shows three title lines with the ampersand on the
third, the tagline, and a portrait image. Set `localStorage.theme = "dark"`, reload,
confirm no flash. Compare side by side with `:3000` at 1440px and 375px widths.

**Commit:**
```bash
git add components/sections/Hero.tsx
git commit -m "feat: migrate hero"
```

---

### Task 5: About — heading, quote, paragraphs, resume link, arsenal, soft skills

**Files:**
- Create: `components/sections/About.tsx`
- Read: `index.html:386-433`, `js/app.js:292-300`

**Interfaces:**
- Consumes: `usePortfolio()`.
- Produces: default-exported `About` client component. Renders its own
  `.skills-languages` / `.skills-frameworks` / `.skills-tools` children as empty
  grids — Task 6 replaces their contents, not this component's shell.

- [ ] **Step 1: Transcribe `index.html:386-433`**

This range covers the section header, the "MY SOFT SKILLS" heading with pill badges,
the "My Arsenal" heading, and the wrapper that holds the three skill grids. Copy all
class strings verbatim.

- [ ] **Step 2: Bind the dynamic values from `js/app.js:292-297`**

```tsx
<div className="about-quote">{profile ? `"${profile.about_quote}"` : '…static text from index.html…'}</div>
<p className="about-text-2">{profile?.about_text_2 ?? '…'}</p>
<a className="resume-link" href={profile?.resume_url ?? 'resume.pdf'}>…</a>
```

`.about-quote` is wrapped in literal double quotes by the JS today
(`js/app.js:292`), so the quote marks must be in the rendered text, not CSS.

- [ ] **Step 3: Render the drop cap from `js/app.js:293`**

`js/app.js` replaces the innerHTML wholesale. In React that is a two-part render:

```tsx
<p className="about-text-1">
  {profile ? (
    <>
      <span className="float-left text-7xl font-display leading-none mr-4 mt-2 text-black dark:text-white">
        {profile.about_text_1.charAt(0)}
      </span>
      {profile.about_text_1.slice(1)}
    </>
  ) : (
    '…static text from index.html:399-403…'
  )}
</p>
```

`charAt(0)` and `slice(1)`, not a fixed letter. The span's six classes must match
exactly or the drop cap loses its float, size, or dark-mode colour.

- [ ] **Step 4: Bind the contact links if present in this range**

`js/app.js:298-300` rewrites every `a[href^="mailto:"]` on the page. If the about
range contains one, render `href={`mailto:${profile?.email}`}` with the static
`index.html` address as the fallback.

**Verify:** the about section shows the large display heading, a quoted pull-quote,
two paragraphs with a drop cap on the first letter of the first paragraph, and a
working resume link. The drop cap must float left with correct spacing in both
themes. Compare against `:3000`.

**Commit:**
```bash
git add components/sections/About.tsx
git commit -m "feat: migrate about section with drop cap"
```

---

### Task 6: Skills — three grids

**Files:**
- Create: `components/sections/Skills.tsx`
- Read: `index.html:434-473`, `js/app.js:306-328`

**Interfaces:**
- Consumes: `usePortfolio()`, `Skill[]`.
- Produces: default-exported `Skills` client component.

- [ ] **Step 1: Transcribe the three grid shells from `index.html:434-473`**

The containers are `.skills-languages`, `.skills-frameworks`, `.skills-tools`. They
are wiped and re-rendered by `renderSkills`, so their inner markup is empty in the
placeholder state. Copy the grid class strings exactly (`grid-cols-4 sm:grid-cols-5
md:grid-cols-6 gap-4` on each).

- [ ] **Step 2: Port `renderSkills` from `js/app.js:306-328`**

Read that range and reproduce its per-item markup exactly — the icon span, the name,
the wrapper classes, and the category dispatch that routes each skill to one of the
three containers. The dispatch keys are whatever `js/app.js` compares `skill.category`
against; copy them verbatim rather than inventing new keys.

- [ ] **Step 3: Partition by category, preserving order**

`renderSkills` filters the single 29-item array into the three buckets. Do not sort
or reorder — the API order is the rendered order today.

**Verify:** 29 skill tiles appear, distributed across all three labelled groups, with
the same counts and same order as `:3000`. Icons render as glyphs, not as tofu boxes.

**Commit:**
```bash
git add components/sections/Skills.tsx
git commit -m "feat: migrate skills grids"
```

---

### Task 7: Services

**Files:**
- Create: `components/sections/Services.tsx`
- Read: `index.html:475-491`, `js/app.js:144-150`, `js/app.js:330-365`

**Interfaces:**
- Consumes: `usePortfolio()`, `Service[]`.
- Produces: default-exported `Services` client component.

- [ ] **Step 1: Transcribe the section shell from `index.html:475-491`**

It carries `id="services"` and a large `font-display` heading. `getServiceLink`
(`js/app.js:144-150`) maps a service title to a `/#…` anchor, so the id matters for
deep links.

- [ ] **Step 2: Port `renderServices` from `js/app.js:330-365`**

Four service cards, each with an icon, title, description, and an `items` bullet list
(`items` is `string[]`). Copy the card and bullet markup exactly.

- [ ] **Step 3: Port `getServiceLink` into the same file**

Copy `js/app.js:144-150` verbatim. It is a pure title-to-anchor map and it drives the
card links. Do not rewrite it as a computed property or a lookup table — the string
comparisons are the contract.

**Verify:** four service cards, each with its bullet list, matching `:3000`. Click a
card link and confirm it anchors to the right section.

**Commit:**
```bash
git add components/sections/Services.tsx
git commit -m "feat: migrate services"
```

---

### Task 8: Work header and category tabs

**Files:**
- Create: `components/work/WorkTabs.tsx`
- Create: `components/sections/Work.tsx`
- Read: `index.html:492-523`, `index.html:874-899`

**Interfaces:**
- Consumes: `SectionBoundary`; the three sub-section components from Tasks 9-11.
- Produces: default-exported `Work` client component owning the tab state, and
  `WorkTabs` rendering the three buttons.

- [ ] **Step 1: Transcribe the header from `index.html:492-523`**

The `<header class="mb-11 space-y-4 ml--10 text-left">` contains **two** headings —
"STORIES" and "Selected Works 2023-2026".

`ml--10` is one of the seven no-ops: a misspelling of `-ml-10` that applies nothing.
Transcribe it exactly. Fixing it shifts the header left by 2.5rem.

- [ ] **Step 2: Replace `showSection()` with `useState`**

```tsx
'use client';
import { useState } from 'react';

type Tab = 'projects' | 'design' | 'events';

const ACTIVE = 'bg-black text-white dark:bg-white dark:text-black shadow-lg';
const INACTIVE = 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white';
```

**The transition utility is not part of the swap.** `index.html:510` gives the active
button `transition-all`; `index.html:515` and `index.html:520` give the inactive two
`transition-colors`. `showSection()` (`index.html:880-894`) never touches that class,
so `#btn-projects` keeps `transition-all` forever and the other two keep
`transition-colors` forever, regardless of which tab is showing. A `useState`
implementation that rebuilds the whole `className` per state gets this wrong on the
first click. Build each button's class string as:

```tsx
className={`px-6 py-2.5 rounded-full font-medium text-sm category-btn ${
  tab === 'projects' ? 'transition-all' : 'transition-colors'
} ${tab === 'projects' ? ACTIVE : INACTIVE}`}
```

- [ ] **Step 3: Reproduce the initial hidden states exactly**

From `index.html:524`, `529`, `536`:

| Element | Initial class string | Hidden at load |
|---|---|---|
| `#projects-section` | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full section-content` | **no** |
| `#design-section` | `w-full section-content hidden` (wraps `.masonry-gallery`) | **yes** |
| `#events-section` | `grid grid-cols-1 md:grid-cols-2 gap-8 w-full section-content hidden` | **yes** |

`hidden` is a Tailwind utility, so toggling it is:

```tsx
<section id="projects-section"
  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full section-content${tab === 'projects' ? '' : ' hidden'}`}
>
```

Keeping `.section-content` on all three matters even though `useState` no longer needs
`querySelectorAll('.section-content')` — the class is part of today's DOM and its
absence would show up in any DOM comparison.

- [ ] **Step 4: Wrap each sub-section in a `SectionBoundary`**

Each fallback is that section's placeholder markup. One broken section must not blank
the other two — that is the failure mode `js/app.js:275-277` provides today.

**Verify:** PROJECTS is active on load with the other two greyed. Click DESIGN GALLERY
— the design grid appears, EVENTS appears empty (there are zero `event` works; that is
correct and matches `:3000`). Click PROJECTS again and confirm the header alignment
and the pill's active colours are identical to `:3000` — specifically that the active
pill still has its original transition class and has not gained or lost spacing.

**Commit:**
```bash
git add components/sections/Work.tsx components/work/WorkTabs.tsx
git commit -m "feat: migrate work header and category tabs"
```

---

### Task 9: Projects grid

**Files:**
- Create: `components/work/ProjectCard.tsx`
- Modify: `components/sections/Work.tsx`
- Read: `index.html:524-528`, `js/app.js:384-417`

**Interfaces:**
- Consumes: `Work[]` filtered to `type === 'project'`.
- Produces: default-exported `ProjectCard({ work }: { work: Work })`.

- [ ] **Step 1: Port the `project` branch of `renderWorks` from `js/app.js:384-417`**

Transcribe the card markup exactly: image, `category_label`, title, description, the
tech-stack badge row, and the live/source link pair. Keep every class string.

- [ ] **Step 2: Preserve the privacy-flag logic**

`is_live_url_private` and `is_source_url_private` control whether each link renders.
Copy the truthiness test exactly as `js/app.js` has it. These are booleans from
`pg`, and the admin form sends them as the strings `'true'`/`'false'` coerced by the
backend — treat them as the API returns them and do not add coercion.

- [ ] **Step 3: Filter in the component**

```tsx
const projects = (data?.works ?? []).filter((w) => w.type === 'project');
```

Seven projects exist. Do not sort; API order is render order.

- [ ] **Step 4: Use the design image size for design works only**

`js/app.js:378-381` passes `width: 900` for design works and `1200` for everything
else, with `height: 900` in both cases. Carry that conditional into the card rather
than normalising it.

**Verify:** seven project cards in the same order as `:3000`, same badge rows, same
link visibility. Resize to 768px and confirm 2 columns, 1024px for 3.

**Commit:**
```bash
git add components/work/ProjectCard.tsx components/sections/Work.tsx
git commit -m "feat: migrate projects grid"
```

---

### Task 10: Design masonry gallery

**Files:**
- Create: `components/work/DesignMasonry.tsx`
- Modify: `components/sections/Work.tsx`
- Read: `index.html:529-535`, `js/app.js:418-439`, `js/app.js:152-154`

**Interfaces:**
- Consumes: `Work[]` filtered to `type === 'design'`.
- Produces: `lib/designLightbox.tsx` exporting `DesignLightboxProvider({ children })`
  and `useDesignLightbox()` returning
  `{ items: Work[]; activeIndex: number | null; open(index: number): void; close(): void; next(step: 1 | -1): void }`.
  This task creates the provider and its state; **Task 12 renders the visual shell**
  that consumes it. The split exists so this task has no forward dependency.
  Also produces: default-exported `DesignMasonry`.

- [ ] **Step 1: Create the lightbox state container in `lib/designLightbox.tsx`**

```tsx
'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Work } from './types';

interface DesignLightboxState {
  items: Work[];
  activeIndex: number | null;
  open: (index: number) => void;
  close: () => void;
  next: (step: 1 | -1) => void;
}

const DesignLightboxContext = createContext<DesignLightboxState | null>(null);

export function useDesignLightbox(): DesignLightboxState {
  const ctx = useContext(DesignLightboxContext);
  if (!ctx) throw new Error('useDesignLightbox must be used inside DesignLightboxProvider');
  return ctx;
}

export function DesignLightboxProvider({
  items,
  children,
}: {
  items: Work[];
  children: React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const open = useCallback((index: number) => setActiveIndex(index), []);
  const close = useCallback(() => setActiveIndex(null), []);
  const next = useCallback((step: 1 | -1) => {
    setActiveIndex((current) => {
      if (current === null) return current;
      // Wraps at both ends. Preserve the direction js/app.js:191-194 uses.
      return (current + step + items.length) % items.length;
    });
  }, [items.length]);

  const value = useMemo(
    () => ({ items, activeIndex, open, close, next }),
    [items, activeIndex, open, close, next],
  );

  return (
    <DesignLightboxContext.Provider value={value}>
      {children}
    </DesignLightboxContext.Provider>
  );
}
```

Read `js/app.js:191-194` and confirm the wrap formula matches. `close()` only clears
the index here; Task 12 adds the `body.lightbox-open` side effect.

- [ ] **Step 2: Port the `design` branch from `js/app.js:418-439`**

Eighteen design works. Each item is a `.masonry-item` inside `.masonry-gallery`. The
masonry itself is CSS `column-count` (2 / 3 / 4 / 5 at the breakpoints in
`globals.css`) — no JavaScript layout, so the column order is pure DOM order. Do not
add a JS masonry or a `<Image>` wrapper.

- [ ] **Step 3: Port `getDesignMetaText` from `js/app.js:152-154`**

It builds the caption shown in the lightbox. Copy it verbatim.

- [ ] **Step 4: Keep the design-work image transform**

`js/app.js:379` passes `width: 900, height: 900` for design works.

- [ ] **Step 5: Wire each tile to `open(index)`**

```tsx
const { open } = useDesignLightbox();
```

Each tile's click handler calls `open(index)` with the tile's index **within the
design-only array**, which is the same ordering `js/app.js:371` builds
(`works.filter((work) => work.type === 'design')`). Mount the tiles inside
`DesignLightboxProvider` with `items={designWorks}` in `components/sections/Work.tsx`.

**Verify:** the DESIGN GALLERY tab shows an 18-tile masonry with the same column counts
at every breakpoint and the same tile order as `:3000`. Tiles do not reflow
unexpectedly when images load. Clicking a tile opens nothing yet — Task 12 renders
the lightbox — but confirm no console error and that `activeIndex` is set (React
DevTools → state).

**Commit:**
```bash
git add lib/designLightbox.tsx components/work/DesignMasonry.tsx components/sections/Work.tsx
git commit -m "feat: migrate design masonry gallery with lightbox state"
```

---

### Task 11: Events grid

**Files:**
- Create: `components/work/EventCard.tsx`
- Modify: `components/sections/Work.tsx`
- Read: `index.html:536-540`, `js/app.js:440-477`

**Interfaces:**
- Consumes: `Work[]` filtered to `type === 'event'`.
- Produces: default-exported `EventCard({ work }: { work: Work })`.

- [ ] **Step 1: Port the `event` branch from `js/app.js:440-477`**

This branch renders `highlights` rather than `tech_stack`, plus `design_tool` and
`client_name`. Copy it exactly, including which fields are conditionally present.

- [ ] **Step 2: Render the empty state honestly**

```tsx
const events = (data?.works ?? []).filter((w) => w.type === 'event');
```

There are **zero** event works in production. The grid is empty and `:3000` is also
empty. Do not add an empty-state message, a placeholder, or a fallback card — that
would be a visible difference. `index.html:537` is an HTML comment; it does not render
and must not be reproduced as text.

**Verify:** the EVENTS tab is visibly empty, matching `:3000`. This is a parity
confirmation, not a bug.

**Commit:**
```bash
git add components/work/EventCard.tsx components/sections/Work.tsx
git commit -m "feat: migrate events grid"
```

---

### Task 12: Design lightbox

**Files:**
- Create: `components/work/DesignLightbox.tsx`
- Read: `index.html:714-767`, `js/app.js:156-262`

**Interfaces:**
- Consumes: `useDesignLightbox()` and `DesignLightboxProvider` from `lib/designLightbox.tsx`
  (created in Task 10).
- Produces: default-exported `DesignLightbox` — the visual shell only. All state
  already lives in the provider, so this component holds no state of its own except
  the `<img>` render guard.

- [ ] **Step 1: Transcribe the lightbox shell from `index.html:714-767`**

`#design-lightbox`, `#lightbox-stage`, the close button, the prev/next controls, and
the caption element. Copy every class string. The shell renders in the DOM at all
times; only its visibility toggles.

- [ ] **Step 2: Wire the shell to the provider state**

```tsx
'use client';
const { items, activeIndex, close, next } = useDesignLightbox();
```

Visibility is `activeIndex !== null`. Read `js/app.js:184-190` and reproduce the exact
class/attribute toggling the original uses for show and hide.

- [ ] **Step 3: Port the content renderer from `js/app.js:156-173`**

`updateLightboxContent(index)` — sets the image `src` via `optimizeCloudinaryImage`,
the caption via `getDesignMetaText`, and the counter text. In React this is derived
from `items[activeIndex]` rather than assigned imperatively:

```tsx
const work = activeIndex === null ? null : items[activeIndex];
```

- [ ] **Step 4: Add the `body.lightbox-open` side effect**

`js/app.js:184-190` toggles that class, and `.lightbox-open { overflow: hidden }` is in
`globals.css`. Add it as an effect keyed on `activeIndex`, restoring the class on
unmount.

- [ ] **Step 5: Port the keyboard and touch handlers from `js/app.js:196-262`**

- Escape closes.
- ArrowLeft / ArrowRight call `next(-1)` / `next(1)`.
- `touchstart` / `touchend` with a **48px** horizontal threshold navigates on swipe.
- The keydown listener checks the hidden state before acting. Reproduce that guard, or
  arrow keys will scroll the page behind an open lightbox.

- [ ] **Step 6: Preserve the empty-`src` initial state**

`js/app.js` initialises the lightbox `<img>` with `src=""` and `alt=""`. React warns on
`<img src="">`. Keep the visual result identical by rendering the `<img>` only when
`activeIndex !== null`, which is also when the shell becomes visible — no flash of a
broken image, and no React warning.

- [ ] **Step 7: Confirm no `<Link>` crept in**

The payload deletion in `finalize-export.mjs` depends on plain `<a>` tags throughout.
Run `grep -rn "from 'next/link'" app components` — expected: no output.

**Verify:** open the lightbox from a tile, navigate with arrows and with a swipe, close
with Escape and with the close button, wrap past the first and last tile, and confirm
the page behind cannot scroll while it is open. Match `:3000` on all of it.

**Commit:**
```bash
git add components/work/DesignLightbox.tsx components/sections/Work.tsx
git commit -m "feat: migrate design lightbox with keyboard and swipe"
```

---

### Task 13: Journey timeline

**Files:**
- Create: `components/sections/Journey.tsx`
- Read: `index.html:541-563`, `js/app.js:479-517`

**Interfaces:**
- Consumes: `usePortfolio()`, `JourneyItem[]`.
- Produces: default-exported `Journey` client component.

- [ ] **Step 1: Transcribe the section shell from `index.html:541-563`**

The heading, the `.timeline-line` element, and the empty container that
`renderJourney` fills. `.timeline-line` is positioned at `left: 50%` and shifts to
`left: 2rem` under 768px — both are in `globals.css`, so the markup just needs the
class.

- [ ] **Step 2: Port `renderJourney` from `js/app.js:479-517`**

Nine items. The fields are `role`, `company`, `dates`, `description`, `logo_url`,
`type`, `order_index`. The type drives the icon — `js/app.js:500` picks `work` or
`school` from `item.type`.

`logo_url` is typed `string | null` and `optimizeCloudinaryImage` takes `string`, so
**coalesce at the call site**:

```tsx
optimizeCloudinaryImage(item.logo_url ?? '', { width: 600, height: 600 })
```

`optimizeCloudinaryImage('')` returns `''`, which then falls through to the bare
filename fallback. That is exactly what `js/app.js` does for the four seeded logos
(`logoNGcodeX.png`, `yibs.png`, `digimark.jpeg`, `ets_nhahealthtech_logo.jpeg`),
which have no Cloudinary URL and are served from the site root. Do not prefix them
with a path — the database stores bare filenames and they resolve from `/`.

- [ ] **Step 3: Keep the alternating left/right layout**

The timeline alternates sides per item. Reproduce the parity rule in `js/app.js`
exactly rather than recomputing it from the index; a different parity rule shifts
every card.

- [ ] **Step 4: Do not add a `key`-based reorder**

`order_index` is the API's ordering. Render in array order.

**Verify:** nine timeline entries, alternating sides, logos loaded, correct icons,
`order_index` 0 first. Check the vertical line's position at 375px (it must be at
`2rem`) and 1440px (`50%`). Compare with `:3000`.

**Commit:**
```bash
git add components/sections/Journey.tsx
git commit -m "feat: migrate journey timeline"
```

---

### Task 14: Contact — left column

**Files:**
- Create: `components/sections/Contact.tsx`
- Read: `index.html:564-618`, `js/app.js:296-300`, `js/app.js:519-540`

**Interfaces:**
- Consumes: `usePortfolio()`.
- Produces: default-exported `Contact`, which renders the left column and mounts
  `ContactForm` (Task 15) in the right.

- [ ] **Step 1: Transcribe `index.html:564-618`**

The section carries `id="contact"` and `flex-grow`. Copy the heading, the copy, and the
three contact rows (location, email, phone) with their material icons.

- [ ] **Step 2: Bind the contact values from `js/app.js:296-297`**

```tsx
<div className="contact-email">{profile?.email ?? '…'}</div>
<div className="contact-phone">{profile?.phone ?? '…'}</div>
```

- [ ] **Step 3: Render the mailto and social grids**

`js/app.js:298-300` rewrites **every** `a[href^="mailto:"]` on the page, so any mailto
in this range must use the profile email. `js/app.js:519-540` populates
`.flex.gap-3.text-xl` (navbar), `#contact .grid.grid-cols-4.gap-4`, and
`footer .flex.space-x-4`. Those three selectors are all in the source today; the
contact one is this task, the other two belong to Tasks 3 and 17.

```tsx
<div className="grid grid-cols-4 gap-4">
  {socials.map((s) => (/* icon + href, per js/app.js:519-540 */))}
</div>
```

Note the container is `grid grid-cols-4 gap-4` — the `-4` is the gap, not a column
count, and the columns are the default one. Copy it exactly.

**Verify:** contact section shows the heading, copy, email and phone populated from the
API, and a 4-icon social row. Compare with `:3000`.

**Commit:**
```bash
git add components/sections/Contact.tsx
git commit -m "feat: migrate contact section left column"
```

---

### Task 15: Contact form

**Files:**
- Create: `components/sections/ContactForm.tsx`
- Read: `index.html:619-662`, `index.html:900-915`

**Interfaces:**
- Consumes: `PortfolioState` via `usePortfolio()` for `profile.whatsapp_number`.
- Produces: default-exported `ContactForm`, mounted by `Contact`.

- [ ] **Step 1: Transcribe the form from `index.html:619-662`**

Fields `#name`, `#email`, `#subject`, `#message`, and the submit button containing
`<span>Send Message</span>`. Copy every input class string — the forms plugin styles
them and any change is visible.

- [ ] **Step 2: Port `sendToWhatsapp` from `index.html:900-915`**

```tsx
function sendToWhatsapp() {
  const name = (document.getElementById('name') as HTMLInputElement).value;
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const subject = (document.getElementById('subject') as HTMLInputElement).value;
  const message = (document.getElementById('message') as HTMLTextAreaElement).value;

  if (!name || !message) {
    // Preserved deliberately — see Global Constraints.
    alert('Please fill in at least your name and message.');
    return;
  }

  const text = `Name: ${name}%0AEmail: ${email}%0ASubject: ${subject}%0AMessage: ${message}`;
  const url = `https://wa.me/${whatsapp}?text=${text}`;
  window.open(url, '_blank').focus();
}
```

Two things must survive verbatim:

- The `alert()` on an empty name or message. Do not replace it with inline validation —
  that is a visible behaviour change.
- `window.open(url, '_blank').focus()`. `.focus()` throws if the popup was blocked.
  That is today's behaviour. Do not "fix" it with optional chaining; wrap it instead
  only if a white-screen console error appears during verification, and if you do,
  say so explicitly rather than silently changing it.

Prefer React state over `getElementById` where it does not change behaviour; the
`id` attributes must still be present in the DOM because they are part of today's
markup.

**Verify:** submit empty — an `alert()` appears, matching `:3000`. Fill name and
message, submit — a WhatsApp tab opens with the prefilled text. Compare the form's
appearance with `:3000`.

**Commit:**
```bash
git add components/sections/ContactForm.tsx
git commit -m "feat: migrate contact form with WhatsApp submit"
```

---

### Task 16: FAQ

**Files:**
- Create: `components/sections/Faq.tsx`
- Read: `index.html:666-713`

**Interfaces:**
- Consumes: nothing. Fully static.
- Produces: default-exported `Faq` — a server component with no `'use client'`.

- [ ] **Step 1: Transcribe `index.html:666-713` verbatim**

A list of `<details>` / `<summary>` pairs. Copy every class string.

**Do not add `'use client'`.** `js/app.js` has no FAQ renderer — the FAQ is static
markup today, and `updateSeo()` (`js/app.js`) scrapes `#faq details > summary` and
`p` to build the `FAQPage` entity in Task 18. That scraping runs in the browser and
works regardless of whether the component is a server or client component, but keeping
it a server component preserves today's zero-JavaScript behaviour for this section.

Native `<details>` gives the open/close behaviour for free; do not add a controlled
open state.

**Verify:** the FAQ list renders, each item expands and collapses on click with the
same marker styling, and matches `:3000`. Open DevTools and confirm no JS errors.

**Commit:**
```bash
git add components/sections/Faq.tsx
git commit -m "feat: migrate FAQ section"
```

---

### Task 17: Footer and floating actions

**Files:**
- Create: `components/site/Footer.tsx`
- Create: `components/site/FloatingActions.tsx`
- Create: `components/site/ThemeToggle.tsx`
- Read: `index.html:768-837`, `index.html:838-850`, `index.html:852-878`, `js/app.js:519-540`

**Interfaces:**
- Consumes: `usePortfolio()` for `.profile-name` (footer) and the footer social row.
- Produces: default-exported `Footer`, `FloatingActions`, `ThemeToggle`.

- [ ] **Step 1: Transcribe the footer from `index.html:768-837`**

`footer .flex.space-x-4` is the footer's social row and is populated by
`renderSocials` (`js/app.js:519-540`). The footer also contains a
`<form class="space-y-3">` at `index.html:810-818` — transcribe it as static markup;
there is no handler for it today.

- [ ] **Step 2: Transcribe the floating actions from `index.html:838-850`**

Two children: the WhatsApp link (`bg-[#25D366]`, `<i class="fab fa-whatsapp text-2xl">`)
and the theme toggle button `#theme-toggle`. Keep the `hover:scale-110
transition-transform` on both and the `shadow-lg`.

- [ ] **Step 3: Port the theme toggle handler from `index.html:869-878`**

The init half is already in `<head>` (Task 2, Step 4). This is the click half:

```tsx
'use client';

export default function ThemeToggle() {
  return (
    <button
      className="p-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:scale-110 transition-transform"
      id="theme-toggle"
      aria-label="Toggle Dark Mode"
      onClick={() => {
        const html = document.documentElement;
        html.classList.toggle('dark');
        localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
      }}
    >
      <span className="material-icons-outlined dark:hidden">dark_mode</span>
      <span className="material-icons-outlined hidden dark:block">light_mode</span>
    </button>
  );
}
```

The button reads nothing from React state — it toggles the class directly. That is
what keeps the theme out of the render path and avoids the hydration mismatch
described in Global Constraints.

- [ ] **Step 4: Keep the two icon spans**

`dark:hidden` and `hidden dark:block` swap the icon with the theme. Copy both; do not
conditionally render one in React, which would change the DOM.

**Verify:** footer matches `:3000`, including its social row populated with 4 icons.
The floating WhatsApp button and theme toggle sit bottom-right. Click the toggle —
the page inverts, the icon changes, and `localStorage.theme` flips. Reload and confirm
the theme persists with no flash. Compare both themes against `:3000`.

**Commit:**
```bash
git add components/site/Footer.tsx components/site/FloatingActions.tsx components/site/ThemeToggle.tsx
git commit -m "feat: migrate footer, floating actions, and theme toggle"
```

---

### Task 18: SEO updater, subpages, build scripts, deploy, and retirement

Bundled because each piece is small and none is independently verifiable without a
full build.

**Files:**
- Create: `lib/seo.ts`
- Modify: `app/page.tsx` — assemble every section in today's DOM order
- Create: `app/graphic-design/page.tsx`, `app/photography/page.tsx`,
  `app/software-development/page.tsx`
- Modify: `scripts/check-assets.mjs`
- Modify: `scripts/deploy.sh`
- Modify: `README.md`, `AGENTS.md`
- Modify: `app/layout.tsx` (ld+json)
- Delete: `index.html`, `graphic-design.html`, `photography.html`,
  `software-development.html`, `js/app.js`, `js/`
- Read: `js/app.js:7-142`, `graphic-design.html`, `photography.html`,
  `software-development.html`

**Interfaces:**
- Consumes: every component from Tasks 3-17.
- Produces: default-exported `applySeo(data: PortfolioData): void`.

- [ ] **Step 1: Port `setMetaContent` and `updateSeo` from `js/app.js:7-142` into `lib/seo.ts`**

```ts
export function setMetaContent(selector: string, content: string): void {
  const element = document.querySelector(selector);
  if (element && content) {
    element.setAttribute('content', content);
  }
}

export function applySeo(data: PortfolioData): void {
  // body of updateSeo, js/app.js:31-142, verbatim
}
```

Ported **verbatim**, including these two details that are easy to lose:

```ts
const roleParts = [profile.title_1, profile.title_2, profile.title_3].filter(Boolean);
const roleText = roleParts.length
  ? roleParts.join(', ').replace(/,([^,]*)$/, ' &$1')
  : 'Software Developer, Graphic Designer & Photographer';
```

The `.replace(/,([^,]*)$/, ' &$1')` turns the last comma into " &", producing
`Software Developer, Graphic Designer & Photographer`.

- [ ] **Step 2: Call `applySeo` from an effect**

```tsx
'use client';
useEffect(() => {
  if (data) applySeo(data);
}, [data]);
```

It stays imperative and runs in the browser. Next's Metadata API is **not** used here
— it would server-render these values, which changes the HTML a crawler reads.

- [ ] **Step 3: Confirm the FAQ scraping still works**

`updateSeo` builds the `FAQPage` entity by reading `#faq details > summary` and the
paragraph inside. The FAQ markup from Task 16 must therefore keep those exact element
shapes and ids. Verify after this step that the emitted JSON-LD contains the FAQ
entries.

- [ ] **Step 4: Assemble `app/page.tsx` in today's DOM order**

The order in `index.html` is: swirl overlay (in layout) → Navbar → Hero → About →
Skills → Services → Work → Journey → Contact → Faq → lightbox → Footer → floating
actions. `index.html:714` places the lightbox **before** the footer, which is unusual
and must be preserved.

```tsx
import { PortfolioProvider } from '@/lib/PortfolioProvider';
// …
export default function Page() {
  return (
    <PortfolioProvider>
      <Navbar />
      <main className="relative z-10">…Hero…</main>
      <About />
      <Skills />
      <Services />
      <Work />
      <Journey />
      <Contact />
      <Faq />
      <DesignLightbox />
      <Footer />
      <FloatingActions />
    </PortfolioProvider>
  );
}
```

- [ ] **Step 5: Migrate the three subpages**

Transcribe each file's body into its route, verbatim. They are plain static pages:
~158 lines each, bare Tailwind, zero `dark:` variants, their own `<h1>`, their own
`ld+json`, and their own nav linking to `/#services`, `/#work`, `/#contact`.

They use only stock palette utilities, so inheriting the global `tailwind.config`
(which adds `primary`, `background-light`, `darkMode: 'class'`) changes nothing about
how they render — the extra utilities are available but unused.

Give each its own `metadata` export for title, description, and OG tags. This is the
one place Next's Metadata API is correct: these values are static and per-page, so
server-rendering them changes nothing a crawler sees differently from today's source.

Keep their `<a href="/#work">` style links as plain `<a>` tags.

- [ ] **Step 6: Retarget `scripts/check-assets.mjs` at `out/`**

Replace `SOURCES` with `['index.html', 'graphic-design.html', 'photography.html',
'software-development.html']` resolved under `OUT = join(REPO_ROOT, 'out')`, and keep
`admin/index.html` pointing at `admin/` since it is still a source file. Change
`REPO_ROOT` to `OUT` for reference resolution and resolve `PINNED_BY_DATA` against
`public/`.

Then **add** the sitemap check:

```js
const sitemap = readFileSync(join(OUT, 'sitemap.xml'), 'utf8');
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const url = m[1].replace(OWN_ORIGIN, '');
  if (!existsSync(join(OUT, url))) {
    problems.push(`  sitemap.xml\n    loc:     ${m[1]}\n    missing: ${url}`);
  }
}
```

This is the new safety net: every URL `sitemap.xml` publishes must exist as a file in
the build output. Delete a favicon or a subpage and this fails before deploy.

- [ ] **Step 7: Rewrite `deploy.sh` PUBLISH and staging**

Replace the 20-line `PUBLISH` array with:

```bash
PUBLISH=(
  # The Next.js static export. Copied by CONTENTS to the docroot root,
  # because out/index.html must become /index.html, not /out/index.html.
  out
  # Not migrated. Stays static HTML, keeps its noindex meta and the
  # robots.txt Disallow rule. Deliberately survives a Next build failure.
  admin
)
```

Guard 2's pattern list (`backend|data|*.env|*.sql|*.log|*.bak*`) does not match `out`
or `admin`, so it needs no change. Replace the staging loop with the contents-copy
version:

```bash
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
for p in "${PUBLISH[@]}"; do
  if [ "$p" = "out" ]; then
    cp -a "$REPO_ROOT/out/." "$STAGE/"
  else
    cp -a "$REPO_ROOT/$p" "$STAGE/"
  fi
done
```

Update **Guard 3** to grep the new publishable paths:

```bash
if grep -rlE '(DATABASE_URL|JWT_SECRET|ADMIN_PASSWORD|CLOUDINARY_API_SECRET)[[:space:]]*=' \
     "$REPO_ROOT/out" "$REPO_ROOT/admin" 2>/dev/null | grep -q .; then
```

Without this, Guard 3 greps `js/` and `index.html`, which no longer exist, and the
credential scan silently stops guarding anything.

- [ ] **Step 8: Update `.gitignore`**

Already handled in Task 1. Confirm `out/`, `.next/`, and `next-env.d.ts` are ignored.

- [ ] **Step 9: Build and run the full gate**

```bash
npm run build
```

Expected: build succeeds, `finalize-export.mjs` reports 4 documents and no dangling
references, `check-assets.mjs` reports OK including the sitemap check.

- [ ] **Step 10: Dry-run the deploy**

```bash
./scripts/deploy.sh
```

Read the rsync itemised output carefully before applying. It must show `out/*` files
landing at the docroot root, `admin/` landing at `/admin/`, and deletions of the old
`js/`, `index.html`, `graphic-design.html`, `photography.html`,
`software-development.html`, `assets/`, and the loose root binaries. If any path
appears nested under `out/`, stop — the staging loop is wrong.

- [ ] **Step 11: Verify the four URLs against a static server**

```bash
cd out && python3 -m http.server 4321 &
for u in / /graphic-design.html /photography.html /software-development.html \
         /resume.pdf /hero-optimized.webp /favicon.ico /sitemap.xml /robots.txt; do
  printf "%-28s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4321$u)"
done
```

Every line must be `200`. This reproduces what nginx's `try_files $uri $uri/ =404`
will do.

- [ ] **Step 12: Final side-by-side review**

Every section, both themes, at 375px / 768px / 1440px. Check the tab switcher, the
lightbox, the theme toggle across a reload, and the contact form's `alert()`.

**Also check the console for hydration errors.** This is the one failure the visual
review cannot catch, because a hydration mismatch makes React silently discard the
server markup and re-render — the page still *looks* right, but the pre-fetch DOM
invariance the whole design rests on is gone. Open DevTools on a fresh load and
confirm zero occurrences of:

- `Hydration failed`
- `Text content does not match`
- `There was an error while hydrating`
- `Expected server HTML to contain a matching <…>`

If any appear, the cause is almost always a value read during render that the server
cannot know — `localStorage.theme`, `Date`, `Math.random`, or a direct `window`
reference outside an effect. Fix it rather than suppressing it.

- [ ] **Step 13: Update `README.md` and `AGENTS.md`**

Both currently document the static/CDN stack, `serve`, and the HTML file layout. Update
the commands section, the tree, the API-URL note (it is now env-configurable and lives
in `lib/api.ts`, not in `js/app.js` and `admin/admin.js`), and the asset list. Note in
`AGENTS.md` that the seven no-op classes are load-bearing and must not be defined.

- [ ] **Step 14: Delete the old source**

```bash
git rm index.html graphic-design.html photography.html software-development.html js/app.js
rmdir js
```

Only now, after the new site is approved. `admin/` stays.

- [ ] **Step 15: Publish**

```bash
./scripts/deploy.sh --apply
curl -s -o /dev/null -w '%{http_code}\n' https://chestlyace.online/
curl -s -o /dev/null -w '%{http_code}\n' https://chestlyace.online/graphic-design.html
```

Both `200`. Then spot-check the live page in a browser.

**Commit:**
```bash
git add -A
git commit -m "feat: complete Next.js migration and retire the static sources"
```
