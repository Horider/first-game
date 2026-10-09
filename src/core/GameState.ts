import { DEFENDERS, type DefenderType } from '../data/defenders';
import { ECONOMY } from '../data/economy';
import type { EnemyType } from '../data/enemies';
import type { LevelDef } from '../data/levels';
import type { GameEvent } from './events';
import { mulberry32 } from './rng';

export interface Defender {
  id: number;
  type: DefenderType;
  row: number;
  col: number;
  hp: number;
  maxHp: number;
  attackTimer: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  row: number;
  /** Left edge in cells: 0 is the wall, 9 is the portal column. */
  x: number;
  hp: number;
  maxHp: number;
  speed: number;
  state: 'walk' | 'attack';
  targetId?: number;
}

export interface Projectile {
  id: number;
  row: number;
  x: number;
  damage: number;
}

export interface CoinDrop {
  id: number;
  row: number;
  x: number;
  value: number;
  age: number;
}

export interface WaveState {
  /** Index of the current (or upcoming) wave. */
  index: number;
  phase: 'break' | 'spawning' | 'clearing' | 'done';
  /** Break countdown or time until the next spawn. */
  timer: number;
  queue: EnemyType[];
  spawned: number;
}

export interface GameState {
  level: LevelDef;
  time: number;
  status: 'playing' | 'paused' | 'won' | 'lost';
  coins: number;
  hearts: number;
  heartsLost: number;
  stars: number;
  defenders: Defender[];
  enemies: Enemy[];
  projectiles: Projectile[];
  drops: CoinDrop[];
  cardCooldowns: Record<DefenderType, number>;
  passiveTimer: number;
  wave: WaveState;
  events: GameEvent[];
  nextId: number;
  rng: () => number;
}

export function createState(level: LevelDef, seed = Date.now()): GameState {
  const cardCooldowns = {} as Record<DefenderType, number>;
  for (const type of Object.keys(DEFENDERS) as DefenderType[]) cardCooldowns[type] = 0;
  return {
    level,
    time: 0,
    status: 'playing',
    coins: ECONOMY.startCoins,
    hearts: ECONOMY.startHearts,
    heartsLost: 0,
    stars: 0,
    defenders: [],
    enemies: [],
    projectiles: [],
    drops: [],
    cardCooldowns,
    passiveTimer: ECONOMY.passiveEvery,
    wave: { index: 0, phase: 'break', timer: ECONOMY.betweenWaves, queue: [], spawned: 0 },
    events: [],
    nextId: 1,
    rng: mulberry32(seed),
  };
}

export function newId(state: GameState): number {
  return state.nextId++;
}

export function emit(state: GameState, event: GameEvent): void {
  state.events.push(event);
}

/** Hand the accumulated events to the view and clear the queue. */
export function drainEvents(state: GameState): GameEvent[] {
  const events = state.events;
  state.events = [];
  return events;
}

export function defenderAt(state: GameState, row: number, col: number): Defender | undefined {
  return state.defenders.find((d) => d.row === row && d.col === col);
}
