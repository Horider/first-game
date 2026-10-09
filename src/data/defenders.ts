export type DefenderType = 'archer' | 'swordsman' | 'shieldbearer';

export interface DefenderDef {
  name: string;
  cost: number;
  hp: number;
  damage: number;
  /** Seconds between attacks; 0 means the defender never attacks. */
  attackEvery: number;
  /** 'lane' = whole lane to the right, a number = cells to the right of its own cell. */
  range: 'lane' | number;
  /** Card cooldown after buying, seconds. */
  cooldown: number;
  sprite: string;
}

export const DEFENDERS = {
  archer: { name: 'Лучник', cost: 50, hp: 60, damage: 10, attackEvery: 1.2, range: 'lane', cooldown: 5, sprite: 'archer' },
  swordsman: { name: 'Мечник', cost: 75, hp: 120, damage: 30, attackEvery: 1.0, range: 1, cooldown: 8, sprite: 'swordsman' },
  shieldbearer: { name: 'Щитоносец', cost: 60, hp: 400, damage: 0, attackEvery: 0, range: 0, cooldown: 15, sprite: 'shieldbearer' },
} satisfies Record<DefenderType, DefenderDef>;

/** Cards shown in the prototype panel. The swordsman comes in the next step. */
export const PROTOTYPE_CARDS: DefenderType[] = ['archer', 'shieldbearer'];

export const ARROW_SPEED = 6; // cells per second
