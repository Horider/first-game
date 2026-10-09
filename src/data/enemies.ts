export type EnemyType = 'orc' | 'water' | 'mud' | 'fire';

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

// The prototype spawns only orcs (sprites from the Tiny RPG Character Asset Pack);
// the drops from the concept stay here for later levels.
export const ENEMIES = {
  orc: { name: 'Орк', hp: 50, dps: 10, speed: 0.4, reward: 10, sprite: 'orc' },
  water: { name: 'Водяная капля', hp: 50, dps: 10, speed: 0.4, reward: 10, sprite: 'water' },
  mud: { name: 'Грязевая капля', hp: 150, dps: 20, speed: 0.3, reward: 25, sprite: 'mud' },
  fire: { name: 'Огненная капля', hp: 300, dps: 35, speed: 0.5, reward: 50, sprite: 'fire' },
} satisfies Record<EnemyType, EnemyDef>;
