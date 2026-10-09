import { STEP } from '../src/config';
import { canPlace, canUpgrade, placeDefender, upgradeDefender } from '../src/core/commands';
import { createState, defenderAt, type GameState } from '../src/core/GameState';
import { tick } from '../src/core/Simulation';
import type { DefenderType } from '../src/data/defenders';
import { LEVELS } from '../src/data/levels';

/**
 * A simple greedy player used to check balance: first an archer on every threatened lane,
 * then a shieldbearer in front, a swordsman behind it, upgrades and more archers.
 * It never clicks coins, so a human who does is a little richer.
 */
function decide(s: GameState) {
  const threat = (row: number) => {
    const xs = s.enemies.filter((e) => e.row === row).map((e) => e.x);
    return xs.length ? 10 - Math.min(...xs) : 0;
  };
  const count = (row: number, ...types: DefenderType[]) => s.defenders.filter((d) => d.row === row && types.includes(d.type)).length;
  const place = (type: DefenderType, row: number, col: number) =>
    canPlace(s, type, row, col) === 'ok' && placeDefender(s, type, row, col) === 'ok';

  const lanes = [0, 1, 2, 3, 4].sort((a, b) => threat(b) - threat(a));
  // Cover every lane first; while the archer card recharges, buy the level-2 one or save up.
  for (const row of lanes) {
    if (count(row, 'archer', 'archer2') > 0) continue;
    place('archer', row, 0) || place('archer2', row, 0);
    return;
  }
  for (const row of lanes) {
    if (threat(row) === 0) continue;
    if (!defenderAt(s, row, 4) && place('shieldbearer', row, 4)) return;
    if (!defenderAt(s, row, 3) && place('swordsman', row, 3)) return;
  }
  for (const d of s.defenders) if (canUpgrade(s, d.id) === 'ok') return void upgradeDefender(s, d.id);
  for (const row of lanes) {
    for (const col of [1, 2]) if (!defenderAt(s, row, col) && place('archer2', row, col)) return;
  }
}

export function playLevel(levelIndex: number, seed: number) {
  const s = createState(LEVELS[levelIndex], seed);
  let t = 0;
  while (s.status === 'playing' && s.time < 1500) {
    if ((t++ & 7) === 0) decide(s);
    tick(s, STEP);
  }
  return s;
}
