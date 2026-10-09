import type { EnemyType } from './enemies';

export type WaveDef = Partial<Record<EnemyType, number>> & { big?: boolean };

export interface LevelDef {
  id: number;
  name: string;
  waves: WaveDef[];
}

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Озеро',
    // Prototype: mud drops are replaced with water ones (concept: 10+1 mud, 15+3 mud).
    waves: [{ water: 5 }, { water: 8 }, { water: 12 }, { water: 11 }, { water: 18, big: true }],
  },
];
