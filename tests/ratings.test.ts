import { describe, expect, it } from 'vitest';
import { defenderRatings, enemyRatings } from '../src/data/ratings';

describe('ratings', () => {
  it('rank defenders on a 0–10 scale', () => {
    expect(defenderRatings('swordsman3').power).toBe(10);
    expect(defenderRatings('shieldbearer3')).toEqual({ power: 0, speed: 0, life: 10 });
    expect(defenderRatings('archer3').power).toBeGreaterThan(defenderRatings('archer2').power);
    expect(defenderRatings('archer2').power).toBeGreaterThan(defenderRatings('archer').power);
    expect(defenderRatings('archer2').life).toBeGreaterThan(defenderRatings('archer').life);
  });

  it('rank orcs: the shaman is the strongest, the raider the weakest', () => {
    expect(enemyRatings('shaman').power).toBe(10);
    expect(enemyRatings('shaman').life).toBe(10);
    expect(enemyRatings('raider').life).toBeLessThan(enemyRatings('hunter').life);
    expect(enemyRatings('raider').speed).toBe(10);
  });
});
