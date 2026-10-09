import type { EnemyType } from './enemies';

export type WaveDef = Partial<Record<EnemyType, number>> & { big?: boolean };

export interface LevelDef {
  id: number;
  name: string;
  waves: WaveDef[];
  /** Enemy health multiplier: later levels have tougher slimes. */
  hpScale: number;
  /** Coins at the start of the level. */
  startCoins: number;
  /** Random gap between two enemies of a wave, seconds. */
  spawnGap: readonly [number, number];
}

/**
 * Each level adds a new, stronger slime and sends more of everything, faster.
 * The first wave stays light so a fresh start can cover all five lanes.
 */
export const LEVELS: LevelDef[] = [
  {
    id: 1,
    hpScale: 1,
    name: 'Озеро',
    startCoins: 150,
    spawnGap: [1, 2.5],
    waves: [{ slime: 6 }, { slime: 10 }, { slime: 14 }, { slime: 18 }, { slime: 26, big: true }],
  },
  {
    id: 2,
    hpScale: 1.4,
    name: 'Болото',
    startCoins: 200,
    spawnGap: [0.9, 2.3],
    waves: [
      { slime: 6 },
      { slime: 12, bigSlime: 3 },
      { slime: 15, bigSlime: 6 },
      { slime: 18, bigSlime: 9 },
      { slime: 26, bigSlime: 14, big: true },
    ],
  },
  {
    id: 3,
    hpScale: 1.5,
    name: 'Пещера',
    startCoins: 250,
    spawnGap: [0.8, 2.1],
    waves: [
      { slime: 7, bigSlime: 1 },
      { slime: 10, bigSlime: 4, slimebody: 1 },
      { slime: 12, bigSlime: 5, slimebody: 2 },
      { slime: 14, bigSlime: 7, slimebody: 4 },
      { slime: 18, bigSlime: 9, slimebody: 6, big: true },
    ],
  },
  {
    id: 4,
    hpScale: 1.5,
    name: 'Руины',
    startCoins: 300,
    spawnGap: [0.7, 1.9],
    waves: [
      { slime: 8, bigSlime: 2 },
      { slime: 10, bigSlime: 5, slimebody: 2 },
      { slime: 12, bigSlime: 6, slimebody: 3, twins: 1 },
      { slime: 14, bigSlime: 8, slimebody: 4, twins: 2 },
      { slime: 20, bigSlime: 10, slimebody: 6, twins: 4, big: true },
    ],
  },
  {
    id: 5,
    hpScale: 1.6,
    name: 'Логово',
    startCoins: 350,
    spawnGap: [0.6, 1.7],
    waves: [
      { slime: 8, bigSlime: 3 },
      { slime: 12, bigSlime: 6, slimebody: 3 },
      { slime: 14, bigSlime: 8, slimebody: 4, twins: 2 },
      { slime: 16, bigSlime: 10, slimebody: 6, twins: 3 },
      { slime: 22, bigSlime: 12, slimebody: 8, twins: 6, big: true },
    ],
  },
];
