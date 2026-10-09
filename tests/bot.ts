import { STEP } from '../src/config';
import { canPlace, placeDefender } from '../src/core/commands';
import { createState, defenderAt } from '../src/core/GameState';
import { tick } from '../src/core/Simulation';
import { LEVELS } from '../src/data/levels';

/**
 * A simple greedy player: guard the most threatened lane with an archer first,
 * then a shieldbearer in front, then more archers. Collects no coins by hand.
 */
export function playLevel(seed: number) {
  const s = createState(LEVELS[0], seed);
  const lanes = [0, 1, 2, 3, 4];
  while (s.status === 'playing' && s.time < 900) {
    const threat = (row: number) => {
      const xs = s.enemies.filter((e) => e.row === row).map((e) => e.x);
      return xs.length ? 10 - Math.min(...xs) : 0;
    };
    const count = (row: number, type: string) => s.defenders.filter((d) => d.row === row && d.type === type).length;
    const order = [...lanes].sort((a, b) => count(a, 'archer') - count(b, 'archer') || threat(b) - threat(a));
    for (const row of order) {
      if (count(row, 'archer') === 0) {
        if (canPlace(s, 'archer', row, 0) === 'ok') placeDefender(s, 'archer', row, 0);
        break;
      }
      if (threat(row) > 0 && !defenderAt(s, row, 4) && canPlace(s, 'shieldbearer', row, 4) === 'ok') {
        placeDefender(s, 'shieldbearer', row, 4);
        break;
      }
      const col = count(row, 'archer');
      if (col < 3 && canPlace(s, 'archer', row, col) === 'ok') {
        placeDefender(s, 'archer', row, col);
        break;
      }
    }
    tick(s, STEP);
  }
  return s;
}
