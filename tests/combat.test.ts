import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/data/levels';
import { placeDefender, upgradeDefender } from '../src/core/commands';
import { DEFENDERS } from '../src/data/defenders';
import { ENEMIES } from '../src/data/enemies';
import { addEnemy, freezeWaves, newGame, run } from './helpers';

describe('combat', () => {
  it('an archer kills a raider coming down its lane', () => {
    const s = newGame();
    freezeWaves(s);
    s.passiveTimer = Infinity;
    placeDefender(s, 'archer', 2, 0);
    addEnemy(s, 2, 8.5);
    run(s, 8);
    expect(s.enemies).toHaveLength(0);
    const loose = s.drops.reduce((sum, d) => sum + d.value, 0);
    expect(s.coins + loose).toBe(LEVELS[0].startCoins - DEFENDERS.archer.cost + ENEMIES.raider.reward);
    expect(s.hearts).toBe(3);
  });

  it('an archer ignores other lanes', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'archer', 0, 0);
    addEnemy(s, 1, 8);
    run(s, 3);
    expect(s.projectiles).toHaveLength(0);
    expect(s.enemies[0].hp).toBe(ENEMIES.raider.hp);
  });

  it('a raider stops at a shieldbearer and hits it', () => {
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

  it('arrows hit the first raider on the lane', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'archer', 0, 0);
    const near = addEnemy(s, 0, 4);
    const far = addEnemy(s, 0, 7);
    run(s, 1);
    expect(near.hp).toBeLessThan(ENEMIES.raider.hp);
    expect(far.hp).toBe(ENEMIES.raider.hp);
  });

  it('a defender with no hp leaves the cell', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'archer', 0, 0);
    s.defenders[0].hp = 0;
    run(s, 0.02);
    expect(s.defenders).toHaveLength(0);
  });

  it('a swordsman only reaches its own cell and the next one', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'swordsman', 1, 0);
    const far = addEnemy(s, 1, 2.5);
    far.speed = 0;
    run(s, 2);
    expect(far.hp).toBe(ENEMIES.raider.hp);
    far.x = 1.5;
    run(s, 0.1);
    expect(far.hp).toBe(ENEMIES.raider.hp - DEFENDERS.swordsman.damage);
  });
});

describe('upgrades', () => {
  it('turns a level-1 archer into level 2, then 3, in place, keeping its share of health', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'archer', 2, 1);
    const d = s.defenders[0];
    d.hp = d.maxHp / 2;
    const coins = s.coins;
    expect(upgradeDefender(s, d.id)).toBe('ok');
    expect(d.type).toBe('archer2');
    expect(d.maxHp).toBe(DEFENDERS.archer2.hp);
    expect(d.hp).toBe(DEFENDERS.archer2.hp / 2);
    expect(s.coins).toBe(coins - DEFENDERS.archer.upgrade!.cost);
    s.coins = 1000;
    expect(upgradeDefender(s, d.id)).toBe('ok');
    expect(d.type).toBe('archer3');
    expect(upgradeDefender(s, d.id)).toBe('maxLevel');
  });

  it('needs enough coins', () => {
    const s = newGame();
    placeDefender(s, 'swordsman', 0, 0);
    s.coins = 0;
    expect(upgradeDefender(s, s.defenders[0].id)).toBe('noCoins');
    expect(s.defenders[0].type).toBe('swordsman');
  });

  it('level-2 defenders can also be bought directly', () => {
    const s = newGame();
    expect(placeDefender(s, 'archer2', 0, 0)).toBe('ok');
    expect(s.coins).toBe(LEVELS[0].startCoins - DEFENDERS.archer2.cost);
  });
});
