import type { AppConfig } from '../services/types';
import { Icon } from '../components/Icon';
import { navigate } from '../app/router';

export function StudyHome({ cfg }: { cfg: AppConfig }) {
  const pages = cfg.navigation.find((n) => n.id === 'study')?.pages ?? [];
  return (
    <div class="stack">
      <p class="lede">Tools to help you learn. Nothing here is scored.</p>
      {pages.map((p) => (
        <button key={p.id} type="button" class="tile" onClick={() => navigate(`study/${p.id}`)}>
          <span class="tile__text">
            <span class="tile__title">{p.label}</span>
            {p.description && <span class="tile__sub">{p.description}</span>}
          </span>
          <span class="round-btn round-btn--khaki" aria-hidden="true"><Icon name="right" size={20} /></span>
        </button>
      ))}
    </div>
  );
}
