import { describe, expect, it } from 'vitest';
import { ECONOMY } from '../src/data/economy';
import { STEP } from '../src/config';
import { placeDefender, setPaused } from '../src/core/commands';
import { tick } from '../src/core/Simulation';
import { drainEvents } from '../src/core/GameState';
import { starsFor } from '../src/core/systems/outcome';
import { LEVELS } from '../src/data/levels';
import { addEnemy, freezeWaves, newGame, run } from './helpers';

describe('waves', () => {
  it('level 1 releases its waves in order, the last one big', () => {
    const expected = LEVELS[0].waves.map((w) => Object.values(w).reduce<number>((n, v) => n + (typeof v === 'number' ? v : 0), 0));
    const s = newGame(7);
    s.hearts = 1000; // let everything walk through
    const perWave: number[] = [];
    let big = false;
    for (let i = 0; i < 20000 && s.status === 'playing'; i++) {
      run(s, 0.5);
      for (const ev of drainEvents(s)) {
        if (ev.type === 'waveStarted') {
          perWave.push(0);
          big = ev.big;
        }
        if (ev.type === 'enemySpawned') perWave[perWave.length - 1]++;
      }
    }
    expect(perWave).toEqual(expected);
    expect(big).toBe(true);
    expect(s.status).toBe('won');
  });

  it('the first wave waits for the set-up time', () => {
    const s = newGame();
    run(s, ECONOMY.firstWave - 0.1);
    expect(s.wave.phase).toBe('break');
    run(s, 0.2);
    expect(s.wave.phase).toBe('spawning');
  });
});

describe('win and loss', () => {
  it('a drop at the wall costs a heart, three of them lose the level', () => {
    const s = newGame();
    freezeWaves(s);
    addEnemy(s, 0, 0.1);
    run(s, 1);
    expect(s.hearts).toBe(2);
    expect(s.status).toBe('playing');
    addEnemy(s, 1, 0.1);
    addEnemy(s, 2, 0.1);
    run(s, 1);
    expect(s.hearts).toBe(0);
    expect(s.status).toBe('lost');
  });

  it('stars depend on lost hearts', () => {
    expect([0, 1, 2].map(starsFor)).toEqual([3, 2, 1]);
  });

  it('a sensible defense clears level 1 with three stars', () => {
    const s = newGame(42);
    s.coins = 10_000;
    for (let row = 0; row < 5; row++) {
      for (const [type, col] of [['archer', 0], ['archer', 1], ['shieldbearer', 3]] as const) {
        s.cardCooldowns[type] = 0;
        placeDefender(s, type, row, col);
      }
    }
    run(s, 600);
    expect(s.status).toBe('won');
    expect(s.stars).toBe(3);
  });

  it('nothing moves while paused', () => {
    const s = newGame();
    freezeWaves(s);
    const e = addEnemy(s, 0, 5);
    setPaused(s, true);
    for (let i = 0; i < 120; i++) tick(s, STEP);
    setPaused(s, false);
    expect(e.x).toBe(5);
  });
});
