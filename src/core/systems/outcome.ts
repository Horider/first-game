import { emit, type GameState } from '../GameState';

/** 3 stars without losing a heart, 2 for one lost heart, 1 for two. */
export function starsFor(heartsLost: number): number {
  return Math.max(1, 3 - heartsLost);
}

export function outcomeSystem(state: GameState): void {
  if (state.hearts <= 0) {
    state.status = 'lost';
    emit(state, { type: 'lost' });
    return;
  }
  if (state.wave.phase === 'done' && state.enemies.length === 0) {
    state.status = 'won';
    state.stars = starsFor(state.heartsLost);
    emit(state, { type: 'won', stars: state.stars });
  }
}
