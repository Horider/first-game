import { describe, expect, it } from 'vitest';
import { canPlace, collectCoin, placeDefender } from '../src/core/commands';
import { DEFENDERS } from '../src/data/defenders';
import { ECONOMY } from '../src/data/economy';
import { addEnemy, freezeWaves, newGame, run } from './helpers';

describe('placing defenders', () => {
  it('charges the price and starts the card cooldown', () => {
    const s = newGame();
    expect(placeDefender(s, 'archer', 0, 0)).toBe('ok');
    expect(s.coins).toBe(ECONOMY.startCoins - DEFENDERS.archer.cost);
    expect(s.cardCooldowns.archer).toBe(DEFENDERS.archer.cooldown);
    expect(s.defenders).toHaveLength(1);
  });

  it('only allows the player half, one defender per cell', () => {
    const s = newGame();
    expect(canPlace(s, 'archer', 0, 5)).toBe('alienGround');
    expect(canPlace(s, 'archer', 5, 0)).toBe('outOfBounds');
    placeDefender(s, 'archer', 2, 4);
    s.cardCooldowns.archer = 0;
    expect(canPlace(s, 'archer', 2, 4)).toBe('occupied');
  });

  it('refuses while the card is cooling down or coins are short', () => {
    const s = newGame();
    placeDefender(s, 'archer', 0, 0);
    expect(canPlace(s, 'archer', 1, 0)).toBe('cooldown');
    s.cardCooldowns.archer = 0;
    s.coins = 10;
    expect(canPlace(s, 'archer', 1, 0)).toBe('noCoins');
  });

  it('card cooldown runs out over time', () => {
    const s = newGame();
    freezeWaves(s);
    placeDefender(s, 'shieldbearer', 0, 0);
    run(s, DEFENDERS.shieldbearer.cooldown + 0.1);
    expect(s.cardCooldowns.shieldbearer).toBe(0);
  });
});

describe('coins', () => {
  it('a killed drop leaves a coin worth its reward', () => {
    const s = newGame();
    freezeWaves(s);
    const e = addEnemy(s, 0, 7);
    e.hp = 0;
    run(s, 0.02);
    expect(s.drops).toHaveLength(1);
    expect(s.drops[0].value).toBe(10);
    const coins = s.coins;
    expect(collectCoin(s, s.drops[0].id)).toBe(true);
    expect(s.coins).toBe(coins + 10);
    expect(s.drops).toHaveLength(0);
  });

  it('uncollected coins fly to the purse after 5 s', () => {
    const s = newGame();
    freezeWaves(s);
    s.passiveTimer = Infinity;
    addEnemy(s, 0, 7).hp = 0;
    run(s, 4.9);
    expect(s.drops).toHaveLength(1);
    run(s, 0.2);
    expect(s.drops).toHaveLength(0);
    expect(s.coins).toBe(ECONOMY.startCoins + 10);
  });

  it('pays passive income on a timer', () => {
    const s = newGame();
    freezeWaves(s);
    run(s, 3 * ECONOMY.passiveEvery + 0.05);
    expect(s.coins).toBe(ECONOMY.startCoins + 3 * ECONOMY.passiveIncome);
  });
});
