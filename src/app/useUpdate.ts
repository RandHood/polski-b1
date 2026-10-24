import { useRegisterSW } from 'virtual:pwa-register/preact';

const CHECK_EVERY_MS = 5 * 60 * 1000;

/** Checks for a new version every 5 minutes and whenever the app comes back to the front. */
export function useUpdate(): (() => void) | null {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const check = () => { if (navigator.onLine) reg.update().catch(() => undefined); };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    },
  });
  return needRefresh ? () => updateServiceWorker(true) : null;
}
