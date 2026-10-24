import { useEffect, useRef, useState } from 'preact/hooks';
import type { AppConfig, Attempt } from '../services/types';
import { allAttempts } from '../services/db';
import { readPref, writePref } from '../services/storage';
import { currentStreak, exerciseSummary, failedSections, inRange, recentTests, sectionPercent, testPassed } from '../services/stats';
import { Toggle } from '../components/Toggle';
import { navigate } from '../app/router';

const W = 320;
const H = 180;
const PAD = { top: 16, right: 40, bottom: 26, left: 30 };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function SectionChart({ tests, sectionId, threshold }: { tests: Attempt[]; sectionId: string; threshold: number }) {
  const points = tests.map((t) => ({ t, p: sectionPercent(t, sectionId) })).filter((x) => x.p !== null) as { t: Attempt; p: number }[];
  if (!points.length) return <p class="empty">No scores for this section yet.</p>;
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const slot = iw / Math.max(points.length, 5);
  const bw = Math.min(26, slot * 0.62);
  const y = (p: number) => PAD.top + ih - (p / 100) * ih;
  const passY = y(threshold);
  return (
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`${sectionId} scores for the last ${points.length} tests: ${points.map((x) => `${x.p}%`).join(', ')}`}>
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(g)} y2={y(g)} class="chart__grid" />
          <text x={PAD.left - 6} y={y(g) + 4} class="chart__axis" text-anchor="end">{g}</text>
        </g>
      ))}
      {points.map(({ t, p }, i) => {
        const x = PAD.left + slot * i + (slot - bw) / 2;
        const pass = p >= threshold;
        const last = i === points.length - 1;
        return (
          <g key={t.id}>
            <rect x={x} y={y(p)} width={bw} height={Math.max(2, y(0) - y(p))} rx={4} class={pass ? 'chart__bar' : 'chart__bar chart__bar--fail'} />
            {(!pass || last) && p >= 12 && <text x={x + bw / 2} y={y(p) + 14} text-anchor="middle" class="chart__val">{p}</text>}
            {(i === 0 || last || points.length <= 5) && (
              <text x={x + bw / 2} y={H - 8} text-anchor="middle" class="chart__axis">{fmtDate(t.finishedAt)}</text>
            )}
          </g>
        );
      })}
      <line x1={PAD.left} x2={W - PAD.right} y1={passY} y2={passY} class="chart__pass" />
      <text x={W - PAD.right + 6} y={passY - 2} class="chart__passlabel">Pass</text>
      <text x={W - PAD.right + 6} y={passY + 10} class="chart__passlabel">{threshold}%</text>
    </svg>
  );
}

export function Statistics({ cfg }: { cfg: AppConfig }) {
  const ranges = cfg.statistics.ranges;
  const sections = cfg.tests.sections;
  const threshold = cfg.tests.passThresholdPercent;
  const [rangeId, setRangeId] = useState(() => readPref('stats.range', cfg.statistics.defaultRange));
  const [sectionId, setSectionId] = useState(() => readPref('stats.section', sections[0].id));
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => { allAttempts().then(setAttempts, () => setAttempts([])); }, []);
  useEffect(() => writePref('stats.range', rangeId), [rangeId]);
  useEffect(() => writePref('stats.section', sectionId), [sectionId]);

  const range = ranges.find((r) => r.id === rangeId) ?? ranges[0];
  const inR = attempts ? inRange(attempts, range.days) : [];
  const ex = exerciseSummary(inR);
  const tests = recentTests(inR, cfg.statistics.recentAttempts);
  const passed = tests.filter((t) => testPassed(t, threshold)).length;
  const streak = currentStreak(tests, threshold);
  const secIndex = Math.max(0, sections.findIndex((s) => s.id === sectionId));
  const labelOf = (id: string) => sections.find((s) => s.id === id)?.label ?? id;

  // Swipe right-to-left moves to the next section; the toggle follows.
  const step = (d: 1 | -1) => {
    const n = secIndex + d;
    if (n >= 0 && n < sections.length) setSectionId(sections[n].id);
  };
  const onDown = (e: PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) step(dx < 0 ? 1 : -1);
  };

  if (!attempts) return <div class="stack"><div class="card card--loading" /></div>;

  return (
    <div class="stack">
      <Toggle label="Time range" options={ranges} value={range.id} onChange={setRangeId} />

      <section class="card">
        <h2 class="card__title">Exercises</h2>
        {ex.percent === null ? (
          <p class="empty">No exercises in the last {range.label.toLowerCase()}. Your accuracy shows here once Exercises are ready.</p>
        ) : (
          <div class="big-stat">
            <span class="big-stat__num">{ex.percent}%</span>
            <span class="big-stat__sub"><strong>correct</strong><span>{ex.correct} of {ex.total} questions</span><span>{ex.count} exercises</span></span>
          </div>
        )}
      </section>

      <section class="card">
        <h2 class="card__title">Tests</h2>
        {!tests.length ? (
          <div class="stack stack--tight">
            <p class="empty">No tests in the last {range.label.toLowerCase()}. A test passes only when every section is at least {threshold}%.</p>
            <button type="button" class="btn btn--ghost btn--small" onClick={() => navigate('settings')}>Add example results in Settings</button>
          </div>
        ) : (
          <>
            <ol class="chips" aria-label="Recent tests, oldest first">
              {tests.map((t) => {
                const ok = testPassed(t, threshold);
                const failed = failedSections(t, threshold).map(labelOf);
                return (
                  <li key={t.id} class={`chip ${ok ? 'chip--pass' : 'chip--fail'}`}
                    title={`${fmtDate(t.finishedAt)}: ${ok ? 'passed' : `failed (${failed.join(', ')} below ${threshold}%)`}`}>
                    <span aria-hidden="true">{ok ? '✓' : '✗'}</span>
                    <span class="sr-only">{fmtDate(t.finishedAt)} {ok ? 'passed' : `failed, ${failed.join(', ')} below ${threshold}%`}</span>
                  </li>
                );
              })}
            </ol>
            <p class="hint">{passed} of {tests.length} passed{streak > 0 ? ` · ${streak} in a row` : ''}</p>

            <div class="chart-head">
              <Toggle label="Test section" wide options={sections} value={sections[secIndex].id} onChange={setSectionId} />
            </div>
            <div class="swipe" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { swipe.current = null; }}>
              <div class="swipe__track" ref={track} style={{ transform: `translateX(-${secIndex * 100}%)` }}>
                {sections.map((s) => (
                  <div key={s.id} class="swipe__slide" aria-hidden={s.id !== sections[secIndex].id}>
                    <SectionChart tests={tests} sectionId={s.id} threshold={threshold} />
                  </div>
                ))}
              </div>
            </div>
            <div class="dots" aria-hidden="true">
              {sections.map((s, i) => <span key={s.id} class={i === secIndex ? 'is-on' : ''} />)}
            </div>
            <p class="hint center">Swipe to change section</p>
          </>
        )}
      </section>
    </div>
  );
}
