import { describe, expect, it } from 'vitest';
import { playLevel } from './bot';

describe('balance of level 1', () => {
  it('a sensible greedy player usually wins, but not always flawlessly', () => {
    const runs = Array.from({ length: 20 }, (_, i) => playLevel(i + 1));
    const wins = runs.filter((s) => s.status === 'won').length;
    expect(wins).toBeGreaterThanOrEqual(16);
  });
});
