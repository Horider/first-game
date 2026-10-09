import type { GameState } from './GameState';
import { combatSystem } from './systems/combat';
import { deathsSystem } from './systems/deaths';
import { economySystem } from './systems/economy';
import { movementSystem } from './systems/movement';
import { outcomeSystem } from './systems/outcome';
import { projectilesSystem } from './systems/projectiles';
import { wavesSystem } from './systems/waves';

/** Advance the level by dt seconds. Does nothing unless the level is running. */
export function tick(state: GameState, dt: number): void {
  if (state.status !== 'playing') return;
  state.time += dt;
  wavesSystem(state, dt);
  movementSystem(state, dt);
  combatSystem(state, dt);
  projectilesSystem(state, dt);
  deathsSystem(state);
  economySystem(state, dt);
  outcomeSystem(state);
}
