import Phaser from 'phaser';
import { FONT } from '../ui/PixelText';
import { createTinyFont } from '../ui/tinyFont';
import { createTextures } from '../view/textures';

const SPRITES = ['archer', 'swordsman', 'shieldbearer', 'water', 'mud', 'fire', 'coin', 'heart'];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    for (const key of SPRITES) this.load.image(key, `${import.meta.env.BASE_URL}assets/sprites/${key}.png`);
  }

  async create() {
    createTextures(this);
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
