import Phaser from 'phaser';
import { VIEW } from '../config';
import { PixelText } from '../ui/PixelText';

interface ResultData {
  won: boolean;
  stars: number;
}

/** Win or loss overlay on top of the frozen level, with stars and a retry button. */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super('result');
  }

  create({ won, stars }: ResultData) {
    const cx = VIEW.width / 2;
    this.add.rectangle(0, 0, VIEW.width, VIEW.height, 0x0b0b10, 0.75).setOrigin(0);

    new PixelText(this, cx, 22, won ? 'Победа!' : 'Поражение', {
      color: won ? '#e6b422' : '#ff6b6b',
      stroke: '#14141c',
      strokeThickness: 2,
    }).setOrigin(0.5);

    if (won) {
      for (let i = 0; i < 3; i++) {
        const star = this.add.image(cx - 14 + i * 14, 44, i < stars ? 'star' : 'star-empty').setScale(0);
        this.tweens.add({ targets: star, scale: 1, delay: 200 + i * 200, duration: 200, ease: 'Back.easeOut' });
      }
    } else {
      new PixelText(this, cx, 44, 'Капли прорвались', { color: '#c8c8d8' }).setOrigin(0.5);
    }

    const button = this.add.rectangle(cx, 76, 76, 16, 0x2c2c3a).setStrokeStyle(1, 0xe6b422).setInteractive({ useHandCursor: true });
    new PixelText(this, cx, 76, 'Ещё раз').setOrigin(0.5);
    button.on('pointerdown', () => this.restart());
    this.input.keyboard!.once('keydown-ENTER', () => this.restart());
  }

  private restart() {
    this.scene.stop();
    this.scene.get('game').scene.restart();
  }
}
