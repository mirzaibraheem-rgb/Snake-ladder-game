/**
 * Loads an editable content file, in this order:
 *  1. Windows desktop: content/<name> next to the .exe or in the install folder (via the Electron preload)
 *  2. Web / Android / iOS: content/<name> served alongside index.html
 *  3. The copy bundled into the app at build time (always works, even offline or from file://)
 */
export type ContentSource = 'external' | 'web' | 'bundled';

export interface LoaderDeps {
  desktop?: (name: string) => Promise<string | null>;
  fetcher?: (url: string) => Promise<string | null>;
}

declare global {
  interface Window {
    softDesktop?: {
      readContent(name: string): Promise<string | null>;
      contentFolder(): Promise<string | null>;
      quit(): void;
    };
  }
}

export async function defaultFetcher(url: string): Promise<string | null> {
  if (typeof location !== 'undefined' && location.protocol === 'file:') return null;
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) return null;
  return await res.text();
}

export function defaultDeps(): LoaderDeps {
  const desk = typeof window !== 'undefined' ? window.softDesktop : undefined;
  return { desktop: desk ? (n) => desk.readContent(n) : undefined, fetcher: defaultFetcher };
}

export async function loadText(name: string, bundled: string, deps: LoaderDeps = defaultDeps()): Promise<{ text: string; source: ContentSource }> {
  if (deps.desktop) {
    try {
      const t = await deps.desktop(name);
      if (typeof t === 'string' && t.trim()) return { text: t, source: 'external' };
    } catch (e) {
      console.warn(`[content] could not read desktop override for ${name}`, e);
    }
    // On desktop the bundled copy is authoritative; file:// fetches are not used.
    return { text: bundled, source: 'bundled' };
  }
  if (deps.fetcher) {
    try {
      const t = await deps.fetcher(`content/${name}`);
      if (typeof t === 'string' && t.trim()) return { text: t, source: 'web' };
    } catch (e) {
      console.warn(`[content] could not fetch ${name}, using the built in copy`, e);
    }
  }
  return { text: bundled, source: 'bundled' };
}
