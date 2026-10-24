import { describe, expect, it } from 'vitest';
import { currentStreak, exerciseSummary, inRange, recentTests, testPassed } from './stats';
import type { Attempt } from './types';

const base = { schemaVersion: 1 as const, topic: 't', startedAt: '', id: '' };
const ex = (correct: number, total: number, at: string): Attempt =>
  ({ ...base, id: at + total, kind: 'exercise', finishedAt: at, correct, total, percent: Math.round((correct / total) * 100) });
const test = (sec: number[], at: string): Attempt => ({
  ...base, id: at, kind: 'test', finishedAt: at, correct: 0, total: 0, percent: 0,
  sections: sec.map((p, i) => ({ id: String(i), correct: p, total: 100, percent: p, passed: p >= 50 })),
});

describe('stats', () => {
  it('weights accuracy by questions, not by exercise', () => {
    const s = exerciseSummary([ex(14, 20, '2026-10-20T00:00:00Z'), ex(5, 5, '2026-10-21T00:00:00Z')]);
    expect(s.percent).toBe(76);
    expect(s.count).toBe(2);
  });

  it('returns null accuracy with no exercises', () => {
    expect(exerciseSummary([]).percent).toBeNull();
  });

  it('fails a test when any one section is below 50%', () => {
    expect(testPassed(test([48, 100, 100, 100], 'x'), 50)).toBe(false);
    expect(testPassed(test([50, 60, 70, 80], 'x'), 50)).toBe(true);
  });

  it('filters by the last N days', () => {
    const now = Date.parse('2026-10-24T12:00:00Z');
    const list = [ex(1, 1, '2026-10-23T12:00:00Z'), ex(1, 1, '2026-10-10T12:00:00Z')];
    expect(inRange(list, 7, now)).toHaveLength(1);
    expect(inRange(list, 30, now)).toHaveLength(2);
  });

  it('keeps the last N tests oldest first and counts the pass streak', () => {
    const t = [test([60, 60, 60, 60], '2026-10-03'), test([40, 60, 60, 60], '2026-10-01'), test([70, 70, 70, 70], '2026-10-05')];
    const r = recentTests(t, 2);
    expect(r.map((a) => a.finishedAt)).toEqual(['2026-10-03', '2026-10-05']);
    expect(currentStreak(recentTests(t, 10), 50)).toBe(2);
  });
});
