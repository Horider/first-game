import type { EnemyType } from './enemies';

export type WaveDef = Partial<Record<EnemyType, number>> & { big?: boolean };

export interface LevelDef {
  id: number;
  name: string;
  waves: WaveDef[];
  /** Enemy health multiplier: later levels have tougher orcs. */
  hpScale: number;
  /** Coins at the start of the level. */
  startCoins: number;
  /** Random gap between two enemies of a wave, seconds. */
  spawnGap: readonly [number, number];
  /** Which armour the orcs wear (sprite level 1-3); purely visual. */
  orcTier: 1 | 2 | 3;
}

/**
 * Each level adds a new, stronger kind of orc and sends more of everything, faster.
 * The first wave stays light so a fresh start can cover all five lanes.
 */
export const LEVELS: LevelDef[] = [
  {
    id: 1,
    hpScale: 1,
    name: 'Озеро',
    startCoins: 150,
    spawnGap: [1, 2.5],
    orcTier: 1,
    waves: [{ raider: 6 }, { raider: 10 }, { raider: 14 }, { raider: 18 }, { raider: 26, big: true }],
  },
  {
    id: 2,
    hpScale: 1.4,
    name: 'Болото',
    startCoins: 200,
    spawnGap: [0.9, 2.3],
    orcTier: 1,
    waves: [
      { raider: 6 },
      { raider: 12, hunter: 3 },
      { raider: 15, hunter: 6 },
      { raider: 18, hunter: 9 },
      { raider: 26, hunter: 14, big: true },
    ],
  },
  {
    id: 3,
    hpScale: 1.5,
    name: 'Пещера',
    startCoins: 250,
    spawnGap: [0.8, 2.1],
    orcTier: 2,
    waves: [
      { raider: 7, hunter: 1 },
      { raider: 10, hunter: 4, bulwark: 1 },
      { raider: 12, hunter: 5, bulwark: 2 },
      { raider: 14, hunter: 7, bulwark: 4 },
      { raider: 18, hunter: 9, bulwark: 6, big: true },
    ],
  },
  {
    id: 4,
    hpScale: 1.6,
    name: 'Руины',
    startCoins: 300,
    spawnGap: [0.7, 1.9],
    orcTier: 2,
    waves: [
      { raider: 8, hunter: 2 },
      { raider: 10, hunter: 5, bulwark: 2 },
      { raider: 12, hunter: 6, bulwark: 3, shaman: 1 },
      { raider: 14, hunter: 8, bulwark: 4, shaman: 2 },
      { raider: 20, hunter: 10, bulwark: 6, shaman: 4, big: true },
    ],
  },
  {
    id: 5,
    hpScale: 1.75,
    name: 'Логово',
    startCoins: 350,
    spawnGap: [0.6, 1.7],
    orcTier: 3,
    waves: [
      { raider: 8, hunter: 3 },
      { raider: 12, hunter: 6, bulwark: 3 },
      { raider: 14, hunter: 8, bulwark: 4, shaman: 2 },
      { raider: 16, hunter: 10, bulwark: 6, shaman: 3 },
      { raider: 22, hunter: 12, bulwark: 8, shaman: 6, big: true },
    ],
  },
];
