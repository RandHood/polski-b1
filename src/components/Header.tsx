import { Icon } from './Icon';
import { goBack } from '../app/router';

export function Header({ title, depth, onMenu, onUpdate }: {
  title: string; depth: number; onMenu: () => void; onUpdate: (() => void) | null;
}) {
  return (
    <header class="header">
      {depth > 1 ? (
        <button type="button" class="round-btn" aria-label="Back" onClick={goBack}><Icon name="back" /></button>
      ) : (
        <button type="button" class="round-btn menu-btn" aria-label="Open menu" onClick={onMenu}><Icon name="menu" /></button>
      )}
      <h1 class="header__title">{title}</h1>
      <span class="header__end">
        {onUpdate && <button type="button" class="update-btn" onClick={onUpdate}>Update</button>}
      </span>
    </header>
  );
}
