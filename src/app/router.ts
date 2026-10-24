import { useEffect, useState } from 'preact/hooks';

export interface Route { path: string; parts: string[]; depth: number }

export function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '') || 'study';
  const parts = path.split('/').filter(Boolean);
  return { path, parts, depth: parts.length };
}

export function navigate(path: string): void {
  if (parse(location.hash).path !== path) location.hash = `#/${path}`;
}

export function goBack(): void {
  const cur = parse(location.hash);
  // Opened straight on a deep link: there is no history to go back to.
  if ((history.state as { inApp?: boolean } | null)?.inApp) history.back();
  else location.replace(`#/${cur.parts.slice(0, -1).join('/') || 'study'}`);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => {
      if (!(history.state as { inApp?: boolean } | null)?.inApp) history.replaceState({ inApp: true }, '');
      setRoute(parse(location.hash));
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
