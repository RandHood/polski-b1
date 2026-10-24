import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { AppConfig, Direction, Word } from '../services/types';
import { loadWords } from '../services/words';
import { readPref, writePref } from '../services/storage';
import { speak, speechAvailable } from '../services/speech';
import { Icon } from '../components/Icon';

const GENDER: Record<string, string> = { m: 'masculine', f: 'feminine', n: 'neuter', pl: 'plural only' };

function tagFor(w: Word): string {
  if (w.pos === 'noun') return w.gender ? `noun · ${w.gender}` : 'noun';
  if (w.pos === 'verb' && w.aspect) return `verb · ${w.aspect === 'perfective' ? 'perf.' : w.aspect === 'imperfective' ? 'imperf.' : 'both'}`;
  return w.pos;
}

function detailFor(w: Word): string | null {
  if (w.pos === 'noun' && w.gender) return GENDER[w.gender];
  if (w.pos === 'verb' && w.aspectPair) return `${w.aspect === 'perfective' ? 'imperfective' : 'perfective'}: ${w.aspectPair}`;
  if (w.governs?.length) return `+ ${w.governs.join(' / ')}`;
  return null;
}

function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FlashCards({ cfg }: { cfg: AppConfig }) {
  const [lang, setLang] = useState(() => readPref('fc.lang', cfg.defaults.translationLanguage));
  const [dir, setDir] = useState<Direction>(() => readPref('fc.dir', cfg.defaults.direction));
  const [catId, setCatId] = useState(() => readPref('fc.cat', cfg.defaults.wordCategory));
  const [shuffle, setShuffle] = useState(() => readPref('fc.shuffle', false));
  const [words, setWords] = useState<Word[] | null>(null);
  const [order, setOrder] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [enter, setEnter] = useState<'next' | 'prev' | 'swap' | ''>('');
  const [error, setError] = useState('');
  const drag = useRef<{ x: number; y: number; dx: number; moved: boolean } | null>(null);
  const press = useRef<number | undefined>(undefined);
  const [dx, setDx] = useState(0);

  const category = cfg.wordCategories.find((c) => c.id === catId) ?? cfg.wordCategories[0];
  const language = cfg.translationLanguages.find((l) => l.code === lang) ?? cfg.translationLanguages[0];

  useEffect(() => writePref('fc.lang', lang), [lang]);
  useEffect(() => writePref('fc.dir', dir), [dir]);
  useEffect(() => writePref('fc.cat', catId), [catId]);
  useEffect(() => writePref('fc.shuffle', shuffle), [shuffle]);

  useEffect(() => {
    let live = true;
    setWords(null);
    setError('');
    loadWords(category).then(
      (w) => { if (live) { setWords(w); setIndex(readPref(`fc.pos.${category.id}`, 0) % Math.max(1, w.length)); } },
      (e: Error) => live && setError(e.message),
    );
    return () => { live = false; };
  }, [category.id]);

  useEffect(() => { if (words) setOrder(shuffle ? shuffled(words) : words); }, [words, shuffle]);
  useEffect(() => { if (!shuffle) writePref(`fc.pos.${category.id}`, index); }, [index, shuffle, category.id]);

  const word = order[index];
  const plFront = dir === 'pl-to-translation';
  const translation = word ? word.translations[language.code] ?? word.translations.en : '';
  const detail = useMemo(() => (word ? detailFor(word) : null), [word]);

  const go = (step: 1 | -1) => {
    if (!order.length) return;
    setFlipped(false);
    setEnter(step === 1 ? 'next' : 'prev');
    setIndex((i) => (i + step + order.length) % order.length);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
  };

  // Tap flips; a horizontal swipe moves to the next or previous card.
  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('.speak')) return;
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    d.dx = e.clientX - d.x;
    if (Math.abs(d.dx) > 8 && Math.abs(d.dx) > Math.abs(e.clientY - d.y)) { d.moved = true; setDx(d.dx); }
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setDx(0);
    if (!d) return;
    if (!d.moved) setFlipped((f) => !f);
    else if (d.dx < -50) go(1);
    else if (d.dx > 50) go(-1);
  };

  const sayDown = () => { press.current = window.setTimeout(() => { press.current = undefined; if (word) speak(word.pl, cfg.speech.lang, true); }, 450); };
  const sayUp = () => {
    if (press.current !== undefined) { clearTimeout(press.current); press.current = undefined; if (word) speak(word.pl, cfg.speech.lang); }
  };

  const swap = () => {
    setDir((d) => (d === 'pl-to-translation' ? 'translation-to-pl' : 'pl-to-translation'));
    setFlipped(false);
    setEnter('swap');
  };

  const langSelect = (
    <span class="select-pill">
      <select id="fc-lang" aria-label="Translation language" value={lang}
        onChange={(e) => setLang((e.currentTarget as HTMLSelectElement).value)}>
        {cfg.translationLanguages.map((l) => (
          <option key={l.code} value={l.code}>{l.code === 'en' ? l.label : `${l.label} · ${l.nativeLabel}`}</option>
        ))}
      </select>
      <Icon name="chevron" size={16} />
    </span>
  );

  const face = (text: string, isPl: boolean, back: boolean) => (
    <div class={`fc-face${back ? ' fc-face--back' : ''}`}>
      <span class="fc-tag">{word ? tagFor(word) : ''}</span>
      <span class={`fc-word${!isPl && language.dir === 'rtl' ? ' fc-word--ar' : ''}`} dir={!isPl ? language.dir : 'ltr'}
        lang={isPl ? 'pl' : language.code}>{text}</span>
      {back && isPl && detail && <span class="fc-detail">{detail}</span>}
      {!back && <span class="fc-hint">Tap to flip</span>}
    </div>
  );

  return (
    <div class="fc" onKeyDown={onKey}>
      <label class="field">
        <span class="sr-only">Word type</span>
        <span class="select-box">
          <select id="fc-cat" value={category.id} onChange={(e) => { setCatId((e.currentTarget as HTMLSelectElement).value); setFlipped(false); }}>
            {cfg.wordCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <Icon name="chevron" size={18} />
        </span>
      </label>

      <div class="fc-langs">
        <div class={`fc-pair${plFront ? '' : ' fc-pair--swapped'}`}>
          {plFront ? <span class="fc-pl">Polish</span> : langSelect}
          <span class="fc-to">to</span>
          {plFront ? langSelect : <span class="fc-pl">Polish</span>}
        </div>
        <button type="button" class={`round-btn round-btn--khaki swap${plFront ? '' : ' is-swapped'}`} aria-label="Swap languages" onClick={swap}>
          <Icon name="swap" size={20} />
        </button>
      </div>

      {error && <p class="toast">{error}</p>}
      {!words && !error && <div class="fc-card fc-card--loading" aria-label="Loading words" />}

      {word && (
        <div class="fc-stage">
          <div key={`${word.id}-${enter}-${dir}`} class={`fc-card${enter ? ` fc-card--enter-${enter}` : ''}`}
            style={dx ? { transform: `translateX(${dx}px) rotate(${dx / 40}deg)`, transition: 'none' } : undefined}
            role="button" tabIndex={0} aria-label={`Flash card. ${flipped ? 'Showing back' : 'Showing front'}. Tap to flip.`}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { drag.current = null; setDx(0); }}>
            {speechAvailable() && (
              <button type="button" class="round-btn round-btn--khaki speak" aria-label={`Say ${word.pl} in Polish. Hold for slow.`}
                onPointerDown={(e) => { e.stopPropagation(); sayDown(); }} onPointerUp={(e) => { e.stopPropagation(); sayUp(); }}
                onPointerLeave={() => { if (press.current !== undefined) { clearTimeout(press.current); press.current = undefined; } }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); speak(word.pl, cfg.speech.lang); } }}
                onContextMenu={(e) => e.preventDefault()}>
                <Icon name="speaker" size={20} />
              </button>
            )}
            <div class={`fc-inner${flipped ? ' is-flipped' : ''}`}>
              {face(plFront ? word.pl : translation, plFront, false)}
              {face(plFront ? translation : word.pl, !plFront, true)}
            </div>
          </div>
        </div>
      )}

      {order.length > 0 && (
        <div class="fc-nav">
          <button type="button" class="icon-btn" aria-label="Previous card" onClick={() => go(-1)}><Icon name="left" /></button>
          <span class="fc-count">{index + 1} / {order.length}</span>
          <button type="button" class="icon-btn" aria-label="Next card" onClick={() => go(1)}><Icon name="right" /></button>
        </div>
      )}
      {order.length > 0 && (
        <button type="button" class={`chip-toggle${shuffle ? ' is-on' : ''}`} aria-pressed={shuffle}
          onClick={() => { setShuffle((s) => !s); setIndex(0); setFlipped(false); }}>
          <Icon name="shuffle" size={16} /> Shuffle
        </button>
      )}
    </div>
  );
}
