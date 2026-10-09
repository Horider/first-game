export type DefenderType =
  | 'archer' | 'archer2' | 'archer3'
  | 'swordsman' | 'swordsman2' | 'swordsman3'
  | 'shieldbearer' | 'shieldbearer2' | 'shieldbearer3';

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
  /** A placed defender of this type can be upgraded in place to `upgrade.to` for `upgrade.cost`. */
  upgrade?: { to: DefenderType; cost: number };
}

/** Every defender has three levels; level 2 archers and swordsmen can also be bought outright. */
export const DEFENDERS: Record<DefenderType, DefenderDef> = {
  archer: {
    name: 'Лучник', cost: 50, hp: 60, damage: 12, attackEvery: 1.2, range: 'lane', cooldown: 5, sprite: 'archer',
    upgrade: { to: 'archer2', cost: 30 },
  },
  archer2: {
    name: 'Стрелок', cost: 75, hp: 90, damage: 20, attackEvery: 1.0, range: 'lane', cooldown: 7, sprite: 'archer2',
    upgrade: { to: 'archer3', cost: 60 },
  },
  archer3: { name: 'Снайпер', cost: 135, hp: 120, damage: 30, attackEvery: 0.75, range: 'lane', cooldown: 7, sprite: 'archer3' },
  swordsman: {
    name: 'Мечник', cost: 75, hp: 140, damage: 30, attackEvery: 1.0, range: 1, cooldown: 8, sprite: 'swordsman',
    upgrade: { to: 'swordsman2', cost: 45 },
  },
  swordsman2: {
    name: 'Рыцарь', cost: 110, hp: 240, damage: 50, attackEvery: 0.9, range: 1, cooldown: 10, sprite: 'swordsman2',
    upgrade: { to: 'swordsman3', cost: 80 },
  },
  swordsman3: { name: 'Паладин', cost: 190, hp: 380, damage: 80, attackEvery: 0.75, range: 1, cooldown: 10, sprite: 'swordsman3' },
  shieldbearer: {
    name: 'Щитоносец', cost: 60, hp: 400, damage: 0, attackEvery: 0, range: 0, cooldown: 15, sprite: 'shieldbearer',
    upgrade: { to: 'shieldbearer2', cost: 40 },
  },
  shieldbearer2: {
    name: 'Страж', cost: 100, hp: 650, damage: 0, attackEvery: 0, range: 0, cooldown: 15, sprite: 'shieldbearer2',
    upgrade: { to: 'shieldbearer3', cost: 60 },
  },
  shieldbearer3: { name: 'Бастион', cost: 160, hp: 950, damage: 0, attackEvery: 0, range: 0, cooldown: 15, sprite: 'shieldbearer3' },
};

/** Cards in the panel, left to right. */
export const CARDS: DefenderType[] = ['archer', 'archer2', 'swordsman', 'swordsman2', 'shieldbearer'];

export const ARROW_SPEED = 6; // cells per second
