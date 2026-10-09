import { describe, expect, it } from 'vitest';
import { placeDefender } from '../src/core/commands';
import { DEFENDERS } from '../src/data/defenders';
import { addEnemy, freezeWaves, newGame, run } from './helpers';

describe('combat', () => {
  it('an archer kills a water drop coming down its lane', () => {
    const s = newGame();
    freezeWaves(s);
    s.passiveTimer = Infinity;
    placeDefender(s, 'archer', 2, 0);
    addEnemy(s, 2, 8.5);
    run(s, 8);
    expect(s.enemies).toHaveLength(0);
    const loose = s.drops.reduce((sum, d) => sum + d.value, 0);
    expect(s.coins + loose).toBe(50 + 10);
    expect(s.hearts).toBe(3);
  });

  it('an archer ignores other lanes', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'archer', 0, 0);
    addEnemy(s, 1, 8);
    run(s, 3);
    expect(s.projectiles).toHaveLength(0);
    expect(s.enemies[0].hp).toBe(50);
  });

  it('a drop stops at a shieldbearer and chews on it', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'shieldbearer', 3, 2);
    const e = addEnemy(s, 3, 3.5);
    run(s, 5);
    expect(e.x).toBe(3);
    expect(e.state).toBe('attack');
    const shield = s.defenders[0];
    expect(shield.hp).toBeLessThan(DEFENDERS.shieldbearer.hp);
    expect(shield.hp).toBeGreaterThan(DEFENDERS.shieldbearer.hp - 50);
  });

  it('arrows hit the first drop on the lane', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'archer', 0, 0);
    const near = addEnemy(s, 0, 4);
    const far = addEnemy(s, 0, 7);
    run(s, 1);
    expect(near.hp).toBeLessThan(50);
    expect(far.hp).toBe(50);
  });

  it('a defender with no hp leaves the cell', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'archer', 0, 0);
    s.defenders[0].hp = 0;
    run(s, 0.02);
    expect(s.defenders).toHaveLength(0);
  });
});
