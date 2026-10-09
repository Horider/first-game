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
    // Prototype: orcs with water-drop stats replace every drop (concept: 10+1 mud, 15+3 mud).
    waves: [{ orc: 5 }, { orc: 8 }, { orc: 12 }, { orc: 11 }, { orc: 18, big: true }],
  },
];
