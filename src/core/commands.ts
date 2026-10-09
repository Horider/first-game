import { COLS, PLAYER_COLS, ROWS } from '../config';
import { DEFENDERS, type DefenderType } from '../data/defenders';
import { defenderAt, emit, newId, type GameState } from './GameState';

export type PlaceResult = 'ok' | 'notPlaying' | 'outOfBounds' | 'alienGround' | 'occupied' | 'noCoins' | 'cooldown';

export function canPlace(state: GameState, type: DefenderType, row: number, col: number): PlaceResult {
  if (state.status !== 'playing') return 'notPlaying';
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 'outOfBounds';
  if (col >= PLAYER_COLS) return 'alienGround';
  if (defenderAt(state, row, col)) return 'occupied';
  if (state.cardCooldowns[type] > 0) return 'cooldown';
  if (state.coins < DEFENDERS[type].cost) return 'noCoins';
  return 'ok';
}

export function placeDefender(state: GameState, type: DefenderType, row: number, col: number): PlaceResult {
  const result = canPlace(state, type, row, col);
  if (result !== 'ok') return result;
  const def = DEFENDERS[type];
  state.coins -= def.cost;
  state.cardCooldowns[type] = def.cooldown;
  const id = newId(state);
  state.defenders.push({ id, type, row, col, hp: def.hp, maxHp: def.hp, attackTimer: 0 });
  emit(state, { type: 'defenderPlaced', id, defender: type, row, col });
  return 'ok';
}

export type UpgradeResult = 'ok' | 'notPlaying' | 'missing' | 'maxLevel' | 'noCoins';

export function canUpgrade(state: GameState, defenderId: number): UpgradeResult {
  if (state.status !== 'playing') return 'notPlaying';
  const d = state.defenders.find((x) => x.id === defenderId);
  if (!d) return 'missing';
  const upgrade = DEFENDERS[d.type].upgrade;
  if (!upgrade) return 'maxLevel';
  if (state.coins < upgrade.cost) return 'noCoins';
  return 'ok';
}

/** Turn a placed level-1 defender into its level-2 version; health keeps its share of the maximum. */
export function upgradeDefender(state: GameState, defenderId: number): UpgradeResult {
  const result = canUpgrade(state, defenderId);
  if (result !== 'ok') return result;
  const d = state.defenders.find((x) => x.id === defenderId)!;
  const upgrade = DEFENDERS[d.type].upgrade!;
  const next = DEFENDERS[upgrade.to];
  state.coins -= upgrade.cost;
  d.hp = (d.hp / d.maxHp) * next.hp;
  d.maxHp = next.hp;
  d.type = upgrade.to;
  emit(state, { type: 'defenderUpgraded', id: d.id, defender: d.type });
  return 'ok';
}

export function collectCoin(state: GameState, dropId: number): boolean {
  if (state.status !== 'playing') return false;
  const index = state.drops.findIndex((d) => d.id === dropId);
  if (index < 0) return false;
  const [drop] = state.drops.splice(index, 1);
  state.coins += drop.value;
  emit(state, { type: 'coinCollected', id: drop.id, value: drop.value, auto: false });
  return true;
}

export function setPaused(state: GameState, paused: boolean): void {
  if (paused && state.status === 'playing') state.status = 'paused';
  else if (!paused && state.status === 'paused') state.status = 'playing';
}
