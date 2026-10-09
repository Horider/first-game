import { COLS } from '../../config';
import { DEFENDERS } from '../../data/defenders';
import { ENEMIES } from '../../data/enemies';
import { emit, newId, type Defender, type Enemy, type GameState } from '../GameState';

/** An archer only shoots at drops that have left the portal and are not behind it. */
function archerTarget(state: GameState, d: Defender): Enemy | undefined {
  let best: Enemy | undefined;
  for (const e of state.enemies) {
    if (e.row !== d.row || e.x + 1 <= d.col + 0.5 || e.x > COLS - 0.4) continue;
    if (!best || e.x < best.x) best = e;
  }
  return best;
}

/** Melee reach: its own cell and `range` cells to the right, so a swordsman hits over a shield. */
function meleeTarget(state: GameState, d: Defender, range: number): Enemy | undefined {
  let best: Enemy | undefined;
  for (const e of state.enemies) {
    if (e.row !== d.row || e.x > d.col + 1 + range + 1e-6 || e.x + 1 <= d.col) continue;
    if (!best || e.x < best.x) best = e;
  }
  return best;
}

export function combatSystem(state: GameState, dt: number): void {
  for (const d of state.defenders) {
    const def = DEFENDERS[d.type];
    if (def.attackEvery <= 0) continue;
    d.attackTimer = Math.max(0, d.attackTimer - dt);
    if (d.attackTimer > 0) continue;

    if (def.range === 'lane') {
      if (!archerTarget(state, d)) continue;
      const id = newId(state);
      state.projectiles.push({ id, row: d.row, x: d.col + 0.75, damage: def.damage });
      emit(state, { type: 'arrowFired', id, from: d.id });
    } else {
      const target = meleeTarget(state, d, def.range);
      if (!target) continue;
      target.hp -= def.damage;
      emit(state, { type: 'meleeHit', from: d.id, target: target.id });
      emit(state, { type: 'enemyHit', id: target.id });
    }
    d.attackTimer = def.attackEvery;
  }

  for (const e of state.enemies) {
    if (e.state !== 'attack') continue;
    const target = state.defenders.find((d) => d.id === e.targetId);
    if (!target) continue;
    target.hp -= ENEMIES[e.type].dps * dt;
    emit(state, { type: 'defenderHit', id: target.id });
  }
}
