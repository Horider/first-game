import type { DefenderType } from '../data/defenders';
import type { EnemyType } from '../data/enemies';

/** Things that happened during a tick; views turn them into animations. */
export type GameEvent =
  | { type: 'waveStarted'; wave: number; total: number; big: boolean }
  | { type: 'enemySpawned'; id: number; enemy: EnemyType; row: number }
  | { type: 'enemyKilled'; id: number; row: number; x: number }
  | { type: 'enemyHit'; id: number }
  | { type: 'defenderPlaced'; id: number; defender: DefenderType; row: number; col: number }
  | { type: 'defenderUpgraded'; id: number; defender: DefenderType }
  | { type: 'defenderHit'; id: number }
  | { type: 'defenderDied'; id: number }
  | { type: 'arrowFired'; id: number; from: number }
  | { type: 'meleeHit'; from: number; target: number }
  | { type: 'coinDropped'; id: number }
  | { type: 'coinCollected'; id: number; value: number; auto: boolean }
  | { type: 'passiveIncome'; value: number }
  | { type: 'heartLost'; hearts: number }
  | { type: 'won'; stars: number }
  | { type: 'lost' };
