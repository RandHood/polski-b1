import type { Attempt } from './types';

const DAY = 24 * 60 * 60 * 1000;

export function inRange(attempts: Attempt[], days: number, now = Date.now()): Attempt[] {
  const from = now - days * DAY;
  return attempts.filter((a) => {
    const t = Date.parse(a.finishedAt);
    return t >= from && t <= now;
  });
}

export interface ExerciseSummary { correct: number; total: number; percent: number | null; count: number }

/** Correct % counts questions, not exercises: 14/20 + 5/5 = 19/25 = 76%. */
export function exerciseSummary(attempts: Attempt[]): ExerciseSummary {
  const ex = attempts.filter((a) => a.kind === 'exercise');
  const correct = ex.reduce((n, a) => n + a.correct, 0);
  const total = ex.reduce((n, a) => n + a.total, 0);
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : null, count: ex.length };
}

export function sectionPercent(a: Attempt, sectionId: string): number | null {
  const s = a.sections?.find((x) => x.id === sectionId);
  return s ? s.percent : null;
}

/** Every section must reach the threshold; one section below it fails the test. */
export function testPassed(a: Attempt, threshold: number): boolean {
  if (!a.sections?.length) return a.percent >= threshold;
  return a.sections.every((s) => s.percent >= threshold);
}

export function failedSections(a: Attempt, threshold: number): string[] {
  return (a.sections ?? []).filter((s) => s.percent < threshold).map((s) => s.id);
}

/** Last N tests in the range, oldest first (left to right on the charts). */
export function recentTests(attempts: Attempt[], n: number): Attempt[] {
  return attempts
    .filter((a) => a.kind === 'test')
    .sort((a, b) => Date.parse(a.finishedAt) - Date.parse(b.finishedAt))
    .slice(-n);
}

export function currentStreak(tests: Attempt[], threshold: number): number {
  let n = 0;
  for (let i = tests.length - 1; i >= 0 && testPassed(tests[i], threshold); i--) n++;
  return n;
}

/** Example results so the Statistics page can be tried before Exercises and Tests exist. */
export function sampleAttempts(now = Date.now(), threshold = 50): Attempt[] {
  const out: Attempt[] = [];
  const topics = ['grammar.genitive', 'grammar.aspect', 'reading.short-texts', 'listening.dialogues', 'vocabulary.home'];
  for (let i = 0; i < 24; i++) {
    const total = [10, 15, 20][i % 3];
    const correct = Math.min(total, Math.round(total * (0.55 + ((i * 37) % 40) / 100)));
    const end = new Date(now - (i * 1.2 + 0.2) * DAY).toISOString();
    out.push({
      id: `sample-ex-${i}`, schemaVersion: 1, kind: 'exercise', topic: topics[i % topics.length],
      startedAt: end, finishedAt: end, correct, total, percent: Math.round((correct / total) * 100), sample: true,
    });
  }
  const scores = [
    [38, 55, 40, 45], [45, 52, 41, 48], [52, 60, 48, 58], [58, 66, 55, 62], [50, 58, 37, 52],
    [62, 70, 56, 64], [55, 66, 46, 60], [66, 74, 60, 70], [70, 78, 63, 72], [74, 80, 68, 76],
  ];
  const ids = ['listening', 'reading', 'grammar', 'writing'];
  scores.forEach((row, i) => {
    const end = new Date(now - (27 - i * 2.8) * DAY).toISOString();
    const sections = row.map((p, k) => ({ id: ids[k], correct: p, total: 100, percent: p, passed: p >= threshold }));
    const correct = row.reduce((x, y) => x + y, 0);
    out.push({
      id: `sample-test-${i}`, schemaVersion: 1, kind: 'test', topic: 'full', startedAt: end, finishedAt: end,
      correct, total: 400, percent: Math.round(correct / 4), sections, passThresholdPercent: threshold,
      passed: sections.every((s) => s.passed), sample: true,
    });
  });
  return out;
}
