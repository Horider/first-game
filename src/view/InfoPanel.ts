import Phaser from 'phaser';
import { VIEW } from '../config';
import { DEFENDERS, type DefenderType } from '../data/defenders';
import { ENEMIES, type EnemyType } from '../data/enemies';
import { defenderRatings, enemyRatings, type Ratings } from '../data/ratings';
import { PixelText } from '../ui/PixelText';

const W = 172;
const H = 68;
const X = VIEW.width - W - 2; // over the alien ground, mostly clear of where defenders stand
const Y = VIEW.height - H - 4;
const ROWS: [keyof Ratings, string, number][] = [
  ['power', 'Сила', 0xff6b4a],
  ['speed', 'Скор', 0x4ac8ff],
  ['life', 'Жизнь', 0x5fe05a],
];

/** Name, a short note and power / speed / life as 10 pips each, for a defender card or a slime. */
export class InfoPanel {
  private root: Phaser.GameObjects.Container;
  private icon: Phaser.GameObjects.Image;
  private title: PixelText;
  private note: PixelText;
  private pips: Phaser.GameObjects.Graphics;
  private values: PixelText[] = [];
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene) {
    const bg = scene.add.rectangle(0, 0, W, H, 0x14141c).setOrigin(0).setStrokeStyle(1, 0x55556e);
    this.icon = scene.add.image(4, 4, 'archer').setOrigin(0);
    this.title = new PixelText(scene, 40, 6, '');
    this.note = new PixelText(scene, 40, 18, '', { color: '#a0a0b8' });
    this.pips = scene.add.graphics();
    const labels = ROWS.map(([, label], i) => new PixelText(scene, 4, 34 + i * 11, label, { color: '#c8c8d8' }));
    this.values = ROWS.map((_, i) => new PixelText(scene, W - 4, 34 + i * 11, '', { color: '#ffffff' }).setOrigin(1, 0));
    this.root = scene.add
      .container(X, Y, [bg, this.icon, this.title, this.note, this.pips, ...labels, ...this.values])
      .setDepth(150)
      .setVisible(false);
  }

  showDefender(type: DefenderType) {
    const def = DEFENDERS[type];
    const reach = def.range === 'lane' ? 'вся линия' : def.attackEvery > 0 ? 'ближний бой' : 'держит врагов';
    this.show(def.sprite, def.name, reach, defenderRatings(type));
  }

  showEnemy(type: EnemyType) {
    const def = ENEMIES[type];
    this.show(def.sprite, def.name, `награда ${def.reward}`, enemyRatings(type));
    // A slime's card closes by itself; a defender card stays while it is selected.
    this.hideTimer = this.scene.time.delayedCall(3000, () => this.hide());
  }

  hide() {
    this.hideTimer?.remove();
    this.root.setVisible(false);
  }

  private show(sprite: string, name: string, note: string, r: Ratings) {
    this.hideTimer?.remove();
    this.icon.setTexture(sprite);
    this.title.setText(name);
    this.note.setText(note);
    const g = this.pips.clear();
    ROWS.forEach(([key, , color], i) => {
      const y = 34 + i * 11;
      for (let p = 0; p < 10; p++) {
        g.fillStyle(p < r[key] ? color : 0x2c2c3a).fillRect(52 + p * 8, y + 1, 5, 6);
      }
      this.values[i].setText(String(r[key]));
    });
    this.root.setVisible(true);
  }
}
