import type { AppConfig } from './types';

let cached: Promise<AppConfig> | null = null;

export function loadConfig(): Promise<AppConfig> {
  if (!cached) {
    cached = fetch(`${import.meta.env.BASE_URL}config/app.json`).then((r) => {
      if (!r.ok) throw new Error(`Could not load app settings (${r.status})`);
      return r.json() as Promise<AppConfig>;
    });
  }
  return cached;
}
