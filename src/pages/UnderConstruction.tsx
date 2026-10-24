import { navigate } from '../app/router';

export function UnderConstruction({ label }: { label: string }) {
  return (
    <div class="construction">
      <div class="construction__rule" aria-hidden="true"><span /></div>
      <h2 class="construction__title">Under construction</h2>
      <div class="construction__rule" aria-hidden="true"><span /></div>
      <p class="construction__text">{label} is getting a little polish.<br />Check back soon.</p>
      <button type="button" class="btn" onClick={() => navigate('study')}>Back to Study</button>
    </div>
  );
}
