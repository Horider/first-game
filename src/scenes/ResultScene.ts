import Phaser from 'phaser';
import { VIEW } from '../config';
import { LEVELS } from '../data/levels';
import { button } from '../ui/Button';
import { PixelText } from '../ui/PixelText';

interface ResultData {
  won: boolean;
  stars: number;
  levelId: number;
}

/** Win or loss overlay on top of the frozen level: stars, retry, next level, menu. */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super('result');
  }

  create({ won, stars, levelId }: ResultData) {
    const cx = VIEW.width / 2;
    this.add.rectangle(0, 0, VIEW.width, VIEW.height, 0x0b0b10, 0.78).setOrigin(0);

    new PixelText(this, cx, 40, won ? 'Победа!' : 'Поражение', {
      fontSize: '16px',
      color: won ? '#e6b422' : '#ff6b6b',
      stroke: '#14141c',
      strokeThickness: 4,
    }).setOrigin(0.5);

    if (won) {
      for (let i = 0; i < 3; i++) {
        const star = this.add.image(cx - 28 + i * 28, 80, i < stars ? 'star' : 'star-empty').setScale(0);
        this.tweens.add({ targets: star, scale: 2, delay: 200 + i * 200, duration: 200, ease: 'Back.easeOut' });
      }
    } else {
      new PixelText(this, cx, 80, 'Орки прорвались к лагерю', { color: '#c8c8d8' }).setOrigin(0.5);
    }

    const next = LEVELS.find((l) => l.id === levelId + 1);
    const go = (id: number | null) => {
      if (id === null) {
        this.scene.stop('game');
        this.scene.start('menu');
        return;
      }
      this.scene.stop();
      this.scene.get('game').scene.restart({ levelId: id });
    };
    if (won && next) {
      button(this, cx, 124, 160, `Дальше: ${next.name}`, () => go(next.id));
    } else if (won) {
      new PixelText(this, cx, 124, 'Все уровни пройдены!', { color: '#00ff8c' }).setOrigin(0.5);
    }
    button(this, cx - 44, 158, 80, 'Ещё раз', () => go(levelId));
    button(this, cx + 44, 158, 80, 'Меню', () => go(null));
    this.input.keyboard!.once('keydown-ENTER', () => go(won && next ? next.id : levelId));
  }
}
