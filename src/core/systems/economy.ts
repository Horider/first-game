import { ECONOMY } from '../../data/economy';
import type { DefenderType } from '../../data/defenders';
import { emit, type GameState } from '../GameState';

export function economySystem(state: GameState, dt: number): void {
  state.drops = state.drops.filter((drop) => {
    drop.age += dt;
    if (drop.age < ECONOMY.coinAutoCollect) return true;
    state.coins += drop.value;
    emit(state, { type: 'coinCollected', id: drop.id, value: drop.value, auto: true });
    return false;
  });

  state.passiveTimer -= dt;
  if (state.passiveTimer <= 0) {
    state.passiveTimer += ECONOMY.passiveEvery;
    state.coins += ECONOMY.passiveIncome;
    emit(state, { type: 'passiveIncome', value: ECONOMY.passiveIncome });
  }

  for (const type of Object.keys(state.cardCooldowns) as DefenderType[]) {
    state.cardCooldowns[type] = Math.max(0, state.cardCooldowns[type] - dt);
  }
}
