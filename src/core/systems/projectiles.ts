import { COLS } from '../../config';
import { ARROW_SPEED } from '../../data/defenders';
import { emit, type Enemy, type GameState } from '../GameState';

export function projectilesSystem(state: GameState, dt: number): void {
  state.projectiles = state.projectiles.filter((p) => {
    const from = p.x;
    p.x += ARROW_SPEED * dt;
    // First living drop on the lane whose body the arrow passed through this tick.
    let hit: Enemy | undefined;
    for (const e of state.enemies) {
      if (e.row !== p.row || e.hp <= 0) continue;
      if (e.x + 0.25 > p.x || e.x + 1 < from) continue;
      if (!hit || e.x < hit.x) hit = e;
    }
    if (hit) {
      hit.hp -= p.damage;
      emit(state, { type: 'enemyHit', id: hit.id });
      return false;
    }
    return p.x < COLS + 1;
  });
}
