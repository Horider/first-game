import Phaser from 'phaser';
import { DEFENDERS } from '../data/defenders';
import { ENEMIES } from '../data/enemies';

/** Every character strip: 12 frames of 48x40, feet at (24, 38). */
export const FRAME = { width: 48, height: 40, footX: 24, footY: 38 };

export type Clip = 'idle' | 'run' | 'act';

const CLIPS: Record<Clip, { start: number; rate: number; repeat: number }> = {
  idle: { start: 0, rate: 5, repeat: -1 },
  run: { start: 4, rate: 8, repeat: -1 },
  act: { start: 8, rate: 12, repeat: 0 },
};

/** Sprite keys of all animated characters: defenders, and every orc in all three armour tiers. */
export function characterKeys(): string[] {
  const keys = new Set(Object.values(DEFENDERS).map((d) => d.sprite));
  for (const e of Object.values(ENEMIES)) for (const tier of [1, 2, 3]) keys.add(`${e.sprite}${tier}`);
  return [...keys];
}

export const clipKey = (sprite: string, clip: Clip) => `${sprite}-${clip}`;

export function createAnims(scene: Phaser.Scene) {
  for (const key of characterKeys()) {
    for (const [clip, c] of Object.entries(CLIPS)) {
      scene.anims.create({
        key: clipKey(key, clip as Clip),
        frames: scene.anims.generateFrameNumbers(key, { start: c.start, end: c.start + 3 }),
        frameRate: c.rate,
        repeat: c.repeat,
      });
    }
  }
}
