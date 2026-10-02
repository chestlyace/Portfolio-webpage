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
