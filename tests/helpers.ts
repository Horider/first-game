import { STEP } from '../src/config';
import { createState, type GameState } from '../src/core/GameState';
import { tick } from '../src/core/Simulation';
import type { EnemyType } from '../src/data/enemies';
import { ENEMIES } from '../src/data/enemies';
import { LEVELS } from '../src/data/levels';

export function newGame(seed = 1): GameState {
  return createState(LEVELS[0], seed);
}

export function run(state: GameState, seconds: number): void {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps && state.status === 'playing'; i++) tick(state, STEP);
}

/** Drop an enemy onto the board directly, bypassing the wave timer. */
export function addEnemy(state: GameState, row: number, x: number, type: EnemyType = 'slime') {
  const def = ENEMIES[type];
  const enemy = { id: state.nextId++, type, row, x, hp: def.hp, maxHp: def.hp, speed: def.speed, state: 'walk' as const };
  state.enemies.push(enemy);
  return enemy;
}

/** Keep the wave system idle so a test controls every enemy itself. */
export function freezeWaves(state: GameState): void {
  state.wave.timer = Infinity;
}
