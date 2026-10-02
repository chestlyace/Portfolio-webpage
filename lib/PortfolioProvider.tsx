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
