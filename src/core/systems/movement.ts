import { emit, type Defender, type Enemy, type GameState } from '../GameState';

/** The closest defender on the enemy's lane that is still ahead of it (to the left). */
export function blockerFor(state: GameState, enemy: Enemy): Defender | undefined {
  let best: Defender | undefined;
  for (const d of state.defenders) {
    if (d.row !== enemy.row || d.col >= enemy.x) continue;
    if (!best || d.col > best.col) best = d;
  }
  return best;
}

export function movementSystem(state: GameState, dt: number): void {
  for (const enemy of state.enemies) {
    const blocker = blockerFor(state, enemy);
    const stopAt = blocker ? blocker.col + 1 : -Infinity;
    const nextX = enemy.x - enemy.speed * dt;
    if (nextX <= stopAt) {
      enemy.x = stopAt;
      enemy.state = 'attack';
      enemy.targetId = blocker!.id;
    } else {
      enemy.x = nextX;
      enemy.state = 'walk';
      enemy.targetId = undefined;
    }
  }

  // Drops that reach the wall take a heart and vanish (no coin).
  const survivors: Enemy[] = [];
  for (const enemy of state.enemies) {
    if (enemy.x <= 0) {
      state.hearts = Math.max(0, state.hearts - 1);
      state.heartsLost++;
      emit(state, { type: 'heartLost', hearts: state.hearts });
    } else {
      survivors.push(enemy);
    }
  }
  state.enemies = survivors;
}
