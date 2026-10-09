import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/data/levels';
import { playLevel } from './bot';

const winsOf = (level: number, runs = 20) =>
  Array.from({ length: runs }, (_, i) => playLevel(level, i + 1)).filter((s) => s.status === 'won').length;

describe('balance', () => {
  it('a sensible greedy player almost always clears level 1', () => {
    expect(winsOf(0)).toBeGreaterThanOrEqual(16);
  });

  it('the last level is clearly harder, but still winnable', () => {
    const wins = winsOf(LEVELS.length - 1);
    expect(wins).toBeLessThanOrEqual(14);
    expect(wins).toBeGreaterThanOrEqual(2);
  });
}, 120000);
