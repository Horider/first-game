export type EnemyType = 'raider' | 'hunter' | 'bulwark' | 'shaman';

export interface EnemyDef {
  name: string;
  hp: number;
  /** Damage per second to the defender it is fighting. */
  dps: number;
  /** Cells per second. */
  speed: number;
  reward: number;
  /** Sprite key without the armour tier: 'orc-raider' + 1..3. */
  sprite: string;
}

/** Orcs, weakest to strongest. */
export const ENEMIES = {
  raider: { name: 'Орк-рубака', hp: 60, dps: 12, speed: 0.45, reward: 10, sprite: 'orc-raider' },
  hunter: { name: 'Орк-охотник', hp: 130, dps: 20, speed: 0.3, reward: 20, sprite: 'orc-hunter' },
  bulwark: { name: 'Орк-громила', hp: 240, dps: 32, speed: 0.4, reward: 35, sprite: 'orc-bulwark' },
  shaman: { name: 'Орк-шаман', hp: 480, dps: 50, speed: 0.25, reward: 60, sprite: 'orc-shaman' },
} satisfies Record<EnemyType, EnemyDef>;
