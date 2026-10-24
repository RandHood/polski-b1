import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { loadConfig } from '../services/config';
import type { AppConfig } from '../services/types';
import { type Route, goBack, useRoute } from './router';
import { SidePanel } from './SidePanel';
import { Header } from '../components/Header';
import { StudyHome } from '../pages/StudyHome';
import { FlashCards } from '../pages/FlashCards';
import { Statistics } from '../pages/Statistics';
import { Settings } from '../pages/Settings';
import { UnderConstruction } from '../pages/UnderConstruction';
import { UpdateBanner } from '../components/UpdateBanner';

type Dir = 'forward' | 'back' | 'switch';

function titleFor(cfg: AppConfig, r: Route): string {
  const item = cfg.navigation.find((n) => n.id === r.parts[0]);
  const page = item?.pages?.find((p) => p.id === r.parts[1]);
  return page?.label ?? item?.label ?? 'Polski B1';
}

function Page({ cfg, route, onMenu }: { cfg: AppConfig; route: Route; onMenu: () => void }) {
  const item = cfg.navigation.find((n) => n.id === route.parts[0]);
  let body: ComponentChildren;
  if (!item) body = <UnderConstruction label="This page" />;
  else if (item.status === 'construction') body = <UnderConstruction label={item.label} />;
  else if (item.id === 'study' && route.parts[1] === 'flash-cards') body = <FlashCards cfg={cfg} />;
  else if (item.id === 'study') body = <StudyHome cfg={cfg} />;
  else if (item.id === 'statistics') body = <Statistics cfg={cfg} />;
  else if (item.id === 'settings') body = <Settings />;
  else body = <UnderConstruction label={item.label} />;
  return (
    <>
      <Header title={titleFor(cfg, route)} depth={route.depth} onMenu={onMenu} />
      <main class="page__body">{body}</main>
    </>
  );
}

export function App() {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [error, setError] = useState('');
  const route = useRoute();
  const [shown, setShown] = useState<{ cur: Route; prev: Route | null; dir: Dir }>({ cur: route, prev: null, dir: 'switch' });
  const [menu, setMenu] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { loadConfig().then(setCfg, (e: Error) => setError(e.message)); }, []);

  useEffect(() => {
    setShown((s) => {
      if (s.cur.path === route.path) return s;
      const dir: Dir = route.depth > s.cur.depth ? 'forward' : route.depth < s.cur.depth ? 'back' : 'switch';
      return { cur: route, prev: s.cur, dir };
    });
  }, [route]);

  // Left-edge swipe: goes back on inner pages, opens the menu on top-level pages.
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touch.current = t.clientX < 24 ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (t.clientX - start.x > 70 && Math.abs(t.clientY - start.y) < 60) {
      if (shown.cur.depth > 1) goBack(); else setMenu(true);
    }
  };

  if (error) return <div class="fatal">{error}. Check your connection and reopen the app.</div>;
  if (!cfg) return <div class="boot" aria-label="Loading" />;

  return (
    <div class="app">
      <SidePanel items={cfg.navigation} current={shown.cur.parts[0]} open={menu} onClose={() => setMenu(false)} />
      <div class="stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {shown.prev && (
          <section key={shown.prev.path} class={`page page--leave-${shown.dir}`} aria-hidden="true"
            onAnimationEnd={() => setShown((s) => ({ ...s, prev: null }))}>
            <Page cfg={cfg} route={shown.prev} onMenu={() => setMenu(true)} />
          </section>
        )}
        <section key={shown.cur.path} class={`page${shown.prev ? ` page--enter-${shown.dir}` : ''}`}>
          <Page cfg={cfg} route={shown.cur} onMenu={() => setMenu(true)} />
        </section>
      </div>
      <UpdateBanner />
    </div>
  );
}
