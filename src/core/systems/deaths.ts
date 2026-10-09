import { ENEMIES } from '../../data/enemies';
import { emit, newId, type GameState } from '../GameState';

export function deathsSystem(state: GameState): void {
  state.enemies = state.enemies.filter((e) => {
    if (e.hp > 0) return true;
    emit(state, { type: 'enemyKilled', id: e.id, row: e.row, x: e.x });
    const id = newId(state);
    state.drops.push({ id, row: e.row, x: e.x + 0.5, value: ENEMIES[e.type].reward, age: 0 });
    emit(state, { type: 'coinDropped', id });
    return false;
  });

  state.defenders = state.defenders.filter((d) => {
    if (d.hp > 0) return true;
    emit(state, { type: 'defenderDied', id: d.id });
    return false;
  });
}
