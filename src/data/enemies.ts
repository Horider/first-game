export type EnemyType = 'slime' | 'bigSlime' | 'slimebody' | 'twins';

export interface EnemyDef {
  name: string;
  hp: number;
  /** Damage per second to the defender it is chewing on. */
  dps: number;
  /** Cells per second. */
  speed: number;
  reward: number;
  sprite: string;
}

/** Slimes from the 32rogues pack, weakest to strongest. */
export const ENEMIES = {
  slime: { name: 'Капелька', hp: 60, dps: 12, speed: 0.45, reward: 10, sprite: 'slime' },
  bigSlime: { name: 'Большая капля', hp: 130, dps: 20, speed: 0.3, reward: 20, sprite: 'slime-big' },
  slimebody: { name: 'Слизень', hp: 240, dps: 32, speed: 0.4, reward: 35, sprite: 'slimebody' },
  twins: { name: 'Двойной слизень', hp: 480, dps: 50, speed: 0.25, reward: 60, sprite: 'slimebody-twins' },
} satisfies Record<EnemyType, EnemyDef>;
