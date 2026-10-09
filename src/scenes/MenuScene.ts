import Phaser from 'phaser';
import { VIEW } from '../config';
import { LEVELS } from '../data/levels';
import { isUnlocked, loadSave } from '../save/storage';
import { button } from '../ui/Button';
import { clipKey, FRAME } from '../view/anims';
import { PixelText } from '../ui/PixelText';

/** Title and level select: each level opens once the previous one is won. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    this.scene.stop('game');
    const cx = VIEW.width / 2;
    const save = loadSave();

    // An archer and an orc face each other across the title.
    this.add.sprite(cx - 70, 40, 'archer').setOrigin(0.5, FRAME.footY / FRAME.height).play(clipKey('archer', 'idle'));
    this.add.sprite(cx + 70, 40, 'orc-raider1').setOrigin(0.5, FRAME.footY / FRAME.height).play(clipKey('orc-raider1', 'idle'));
    new PixelText(this, cx, 30, 'Орки', {
      fontSize: '16px',
      color: '#e6b422',
      stroke: '#14141c',
      strokeThickness: 4,
    }).setOrigin(0.5);
    new PixelText(this, cx, 52, 'против лагеря', { color: '#c8c8d8' }).setOrigin(0.5);

    LEVELS.forEach((level, i) => {
      const y = 84 + i * 26;
      const open = isUnlocked(save, level.id);
      button(this, cx - 20, y, 200, `${level.id}. ${level.name}`, () => this.scene.start('game', { levelId: level.id }), open);
      const stars = save.stars[level.id] ?? 0;
      for (let s = 0; s < 3; s++) {
        this.add.image(cx + 96 + s * 12, y, s < stars ? 'star' : 'star-empty').setAlpha(open ? 1 : 0.4);
      }
    });
  }
}
