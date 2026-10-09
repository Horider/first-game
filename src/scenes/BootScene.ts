import Phaser from 'phaser';
import { FONT } from '../ui/PixelText';
import { createTinyFont } from '../ui/tinyFont';
import { createTextures } from '../view/textures';

const SPRITES = ['archer', 'swordsman', 'shieldbearer', 'water', 'mud', 'fire', 'coin', 'heart'];

/** Orc animations cut from the Tiny RPG Character Asset Pack by scripts/import_pack.py. */
const ORC_ANIMS = [
  { key: 'walk', frames: 8, rate: 10, repeat: -1 },
  { key: 'attack', frames: 6, rate: 10, repeat: -1 },
  { key: 'hurt', frames: 4, rate: 12, repeat: 0 },
  { key: 'death', frames: 4, rate: 10, repeat: 0 },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    const base = `${import.meta.env.BASE_URL}assets/sprites/`;
    for (const key of SPRITES) this.load.image(key, `${base}${key}.png`);
    for (const { key } of ORC_ANIMS) {
      this.load.spritesheet(`orc-${key}`, `${base}orc-${key}.png`, { frameWidth: 50, frameHeight: 50 });
    }
  }

  async create() {
    createTextures(this);
    for (const { key, frames, rate, repeat } of ORC_ANIMS) {
      this.anims.create({
        key: `orc-${key}`,
        frames: this.anims.generateFrameNumbers(`orc-${key}`, { start: 0, end: frames - 1 }),
        frameRate: rate,
        repeat,
      });
    }
    createTinyFont(this);
    // Canvas text only uses a web font once it is loaded; wait so the first labels are right.
    try {
      await document.fonts.load(`8px ${FONT}`, 'Волна 0123456789');
    } catch {
      // Falls back to the browser's monospace font.
    }
    this.scene.start('game');
  }
}
