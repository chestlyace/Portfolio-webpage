'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { usePortfolio } from './PortfolioProvider';
import type { Work } from './types';

// js/app.js:156-194 — the design lightbox's state. The source keeps
// `designWorks` (js/app.js:371) and `activeDesignIndex` in module scope and
// writes the DOM directly; here the same two pieces live in one context so
// the tiles (Task 10) and the lightbox shell (Task 12) read one array and
// one index. The provider takes no `items` prop: deriving from
// usePortfolio() keeps `open(index)` indices and the shell's indices
// provably identical, and lets Task 18 mount the provider at page level
// rather than inside Work's subtree.
interface DesignLightboxState {
  items: Work[];
  activeIndex: number | null;
  isOpen: boolean;
  open: (index: number) => void;
  close: () => void;
  next: (step: 1 | -1) => void;
}

const DesignLightboxContext = createContext<DesignLightboxState | null>(null);

// No default value: outside DesignLightboxProvider there is no array for the
// tile indices to refer to, so useDesignLightbox() throws. That is intended —
// Task 18 mounts the provider at page level, and in between SectionBoundary
// catches the error and shows the placeholder markup.
export function useDesignLightbox(): DesignLightboxState {
  const ctx = useContext(DesignLightboxContext);
  if (!ctx) {
    throw new Error('useDesignLightbox must be used inside DesignLightboxProvider');
  }
  return ctx;
}

export function DesignLightboxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = usePortfolio();

  // js/app.js:371 — `designWorks = works.filter(work.type === 'design')` in
  // API order. Derived once per `data` and never re-filtered anywhere else:
  // the tiles' `data-design-index` and the shell's index are positions in
  // this one array.
  const items = useMemo(
    () => (data?.works ?? []).filter((w) => w.type === 'design'),
    [data],
  );

  // js/app.js:158 — `activeDesignIndex`, null until the first open. It is NOT
  // reset by closeDesignLightbox (js/app.js:184-189 only adds `hidden`, sets
  // aria-hidden and drops body.lightbox-open), so the caption and the image
  // src/alt written by updateLightboxContent stay in the DOM after a close —
  // verified against the pre-migration site, whose #lightbox-title still reads
  // the last item's title after Escape. open/closed therefore cannot be derived
  // from the index; `isOpen` below is the separate flag.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // js/app.js:175-179 / :186-188 — the `hidden` / aria-hidden / body class
  // half of open and close, which is the shell's (Task 12). Tracked apart from
  // activeIndex for the reason above: closing must not erase the content.
  const [isOpen, setIsOpen] = useState(false);

  // js/app.js:174-182 openDesignLightbox(index). The source's
  // `if (!designWorks.length) return;` guard is unreachable here: open() is
  // only reachable from a rendered tile, which only exists when
  // items.length > 0 (the shell early-returns while hidden).
  const open = useCallback((index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  }, []);

  // js/app.js:184-189 closeDesignLightbox(). Only the visibility half lives
  // here; the index is deliberately left alone, because the source's close does
  // not touch activeDesignIndex either.
  const close = useCallback(() => setIsOpen(false), []);

  const next = useCallback(
    (step: 1 | -1) => {
      setActiveIndex((current) => {
        // js/app.js:58 `if (!designWorks.length) return;` has no counterpart:
        // `current` is only non-null via open(), which needs a rendered tile
        // (items.length > 0), and the shell early-returns while hidden — so
        // the guard could never fire. Only the null case is mirrored.
        if (current === null) return current;
        // js/app.js:159 — `(index + length) % length` wraps at both ends;
        // preserving `current + step` keeps the direction js/app.js:191-194
        // showNextDesign(step) relies on.
        return (current + step + items.length) % items.length;
      });
    },
    [items.length],
  );

  const value = useMemo(
    () => ({ items, activeIndex, isOpen, open, close, next }),
    [items, activeIndex, isOpen, open, close, next],
  );

  return (
    <DesignLightboxContext.Provider value={value}>
      {children}
    </DesignLightboxContext.Provider>
  );
}

// js/app.js:152-154 — getDesignMetaText, verbatim. `filter(Boolean)` drops
// the nulls, so a work with only one field yields that field alone and a
// work with neither falls back to 'Design gallery item'. The separator is
// U+2022 BULLET with a space on both sides. Pure function; the lightbox
// shell (Task 12) uses it for the caption — no consumer in Task 10.
export function getDesignMetaText(work: Work): string {
  return [work.design_tool, work.client_name].filter(Boolean).join(' • ') || 'Design gallery item';
}
