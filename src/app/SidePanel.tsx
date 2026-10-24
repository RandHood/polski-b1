import type { NavItem } from '../services/types';
import { Icon } from '../components/Icon';
import { navigate } from './router';

export function SidePanel({ items, current, open, onClose }: {
  items: NavItem[]; current: string; open: boolean; onClose: () => void;
}) {
  return (
    <>
      <div class={`scrim${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <nav class={`panel${open ? ' is-open' : ''}`} aria-label="Sections">
        <div class="panel__top">
          <div class="panel__brand">Polski B1</div>
          <button type="button" class="round-btn panel__close" aria-label="Close menu" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <ul class="panel__list">
          {items.map((it) => (
            <li key={it.id}>
              <button type="button" class={`panel__item${current === it.id ? ' is-on' : ''}`}
                aria-current={current === it.id ? 'page' : undefined}
                onClick={() => { onClose(); navigate(it.id); }}>
                <span class="panel__icon"><Icon name={it.icon} size={20} /></span>
                <span>{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div class="panel__version">Version {__APP_VERSION__}</div>
      </nav>
    </>
  );
}
