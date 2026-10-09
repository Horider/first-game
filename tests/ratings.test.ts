import { describe, expect, it } from 'vitest';
import { defenderRatings, enemyRatings } from '../src/data/ratings';

describe('ratings', () => {
  it('rank defenders on a 0–10 scale', () => {
    expect(defenderRatings('swordsman2').power).toBe(10);
    expect(defenderRatings('shieldbearer')).toEqual({ power: 0, speed: 0, life: 10 });
    expect(defenderRatings('archer2').power).toBeGreaterThan(defenderRatings('archer').power);
    expect(defenderRatings('archer2').life).toBeGreaterThan(defenderRatings('archer').life);
  });

  it('rank slimes: the twins are the strongest, the small slime the weakest', () => {
    expect(enemyRatings('twins').power).toBe(10);
    expect(enemyRatings('twins').life).toBe(10);
    expect(enemyRatings('slime').life).toBeLessThan(enemyRatings('bigSlime').life);
    expect(enemyRatings('slime').speed).toBe(10);
  });
});
