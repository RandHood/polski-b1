import { useRegisterSW } from 'virtual:pwa-register/preact';

export function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div class="update" role="status">
      <span>A new version is ready.</span>
      <button type="button" class="btn btn--small" onClick={() => updateServiceWorker(true)}>Reload</button>
    </div>
  );
}
