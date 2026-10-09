import Phaser from 'phaser';
import { VIEW } from '../config';
import type { GameState } from '../core/GameState';
import { CARDS, DEFENDERS, type DefenderType } from '../data/defenders';
import { PixelText } from '../ui/PixelText';
import { COLORS } from './textures';

const CARD = { x: 4, y: 4, w: 34, h: 48, gap: 3 };
const BUTTON = { size: 20, gap: 3 };
/** Pause and three speed buttons, flush with the right edge. */
const RIGHT = { x: VIEW.width - 4 - 4 * BUTTON.size - 3 * BUTTON.gap, y: 6 };

export const SPEEDS = [1, 2, 3] as const;

interface CardView {
  type: DefenderType;
  x: number;
  frame: Phaser.GameObjects.Graphics;
  price: PixelText;
  shade: Phaser.GameObjects.Rectangle;
}

/** Top panel: defender cards, coins and hearts, level name, pause and speed buttons. */
export class Hud {
  private cards: CardView[] = [];
  private coinText: PixelText;
  private hearts: Phaser.GameObjects.Image[] = [];
  private pauseIcon: Phaser.GameObjects.Image;
  private buttons: { key: 'pause' | number; x: number; frame: Phaser.GameObjects.Graphics }[] = [];
  private banner: PixelText;
  private lastCoins = -1;
  selected: DefenderType | null = null;

  constructor(
    private scene: Phaser.Scene,
    levelLabel: string,
    onCard: (type: DefenderType) => void,
    onPause: () => void,
    onSpeed: (speed: number) => void,
  ) {
    scene.add.rectangle(0, 0, VIEW.width, VIEW.panelHeight, COLORS.panel).setOrigin(0);

    CARDS.forEach((type, i) => {
      const x = CARD.x + i * (CARD.w + CARD.gap);
      const frame = scene.add.graphics();
      scene.add.image(x + CARD.w / 2, CARD.y + 1, DEFENDERS[type].sprite).setOrigin(0.5, 0);
      if (type.endsWith('2')) {
        new PixelText(scene, x + 3, CARD.y + 3, '2', { color: '#00ff8c', stroke: '#14141c', strokeThickness: 2 });
      }
      const price = new PixelText(scene, x + CARD.w / 2, CARD.y + CARD.h - 10, String(DEFENDERS[type].cost)).setOrigin(0.5, 0);
      // Cooldown curtain: drops from the top and shrinks as the card recharges.
      const shade = scene.add.rectangle(x + 1, CARD.y + 1, CARD.w - 2, CARD.h - 2, 0x000000, 0.6).setOrigin(0);
      scene.add.zone(x, CARD.y, CARD.w, CARD.h).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => onCard(type));
      this.cards.push({ type, x, frame, price, shade });
    });

    // Coins and hearts in the middle column.
    const midX = CARD.x + CARDS.length * (CARD.w + CARD.gap) + 4;
    scene.add.image(midX, 10, 'coin').setOrigin(0).setScale(2);
    this.coinText = new PixelText(scene, midX + 16, 12, '0', { color: COLORS.gold });
    for (let i = 0; i < 3; i++) this.hearts.push(scene.add.image(midX + i * 22, 32, 'heart').setOrigin(0).setScale(2));

    // Level name, pause and speed buttons on the right.
    new PixelText(scene, VIEW.width - 4, 38, levelLabel, { color: '#c8c8d8' }).setOrigin(1, 0);
    (['pause', ...SPEEDS] as const).forEach((key, i) => {
      const x = RIGHT.x + i * (BUTTON.size + BUTTON.gap);
      const frame = scene.add.graphics();
      if (key === 'pause') {
        this.pauseIcon = scene.add.image(x + BUTTON.size / 2, RIGHT.y + BUTTON.size / 2, 'pause');
      } else {
        new PixelText(scene, x + BUTTON.size / 2 + 1, RIGHT.y + BUTTON.size / 2 + 1, `${key}x`).setOrigin(0.5);
      }
      scene.add
        .zone(x, RIGHT.y, BUTTON.size, BUTTON.size)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => (key === 'pause' ? onPause() : onSpeed(key)));
      this.buttons.push({ key, x, frame });
    });
    this.pauseIcon ??= scene.add.image(0, 0, 'pause');

    this.banner = new PixelText(scene, VIEW.width / 2, VIEW.panelHeight + 80, '', {
      fontSize: '16px',
      stroke: '#14141c',
      strokeThickness: 4,
      align: 'center',
    })
      .setOrigin(0.5)
      .setDepth(100)
      .setVisible(false);
  }

  sync(state: GameState, speed: number) {
    for (const card of this.cards) {
      const def = DEFENDERS[card.type];
      const cooldown = state.cardCooldowns[card.type];
      const affordable = state.coins >= def.cost;
      const selected = this.selected === card.type;
      card.frame
        .clear()
        .fillStyle(selected ? COLORS.cardSelected : COLORS.cardBorder)
        .fillRect(card.x, CARD.y, CARD.w, CARD.h)
        .fillStyle(COLORS.card)
        .fillRect(card.x + 1, CARD.y + 1, CARD.w - 2, CARD.h - 2);
      card.shade.setVisible(cooldown > 0 || !affordable);
      card.shade.height = cooldown > 0 ? Math.ceil((CARD.h - 2) * (cooldown / def.cooldown)) : CARD.h - 2;
      card.price.setColor(affordable ? '#ffffff' : '#ff6b6b');
    }

    const paused = state.status === 'paused';
    for (const b of this.buttons) {
      const active = b.key === 'pause' ? paused : b.key === speed;
      b.frame
        .clear()
        .fillStyle(active ? COLORS.cardSelected : COLORS.cardBorder)
        .fillRect(b.x, RIGHT.y, BUTTON.size, BUTTON.size)
        .fillStyle(active ? 0x5a4a10 : COLORS.card)
        .fillRect(b.x + 1, RIGHT.y + 1, BUTTON.size - 2, BUTTON.size - 2);
    }
    this.pauseIcon.setTexture(paused ? 'play' : 'pause');

    if (state.coins !== this.lastCoins) {
      if (this.lastCoins >= 0 && state.coins > this.lastCoins) {
        this.scene.tweens.add({ targets: this.coinText, y: 10, duration: 60, yoyo: true });
      }
      this.coinText.setText(String(state.coins));
      this.lastCoins = state.coins;
    }

    this.hearts.forEach((h, i) => (i < state.hearts ? h.clearTint().setAlpha(1) : h.setTint(0x3a3a4a).setAlpha(0.8)));
  }

  /** Big centred message over the board. `hold` = stay until hidden. */
  showBanner(text: string, color = '#ffffff', hold = false) {
    this.scene.tweens.killTweensOf(this.banner);
    this.banner.setText(text).setColor(color).setVisible(true).setAlpha(1);
    if (hold) return;
    this.scene.tweens.add({ targets: this.banner, alpha: 0, delay: 1400, duration: 300, onComplete: () => this.banner.setVisible(false) });
  }

  hideBanner() {
    this.scene.tweens.killTweensOf(this.banner);
    this.banner.setVisible(false);
  }

  shakeHeart(index: number) {
    const heart = this.hearts[index];
    if (heart) this.scene.tweens.add({ targets: heart, y: heart.y + 2, duration: 50, yoyo: true, repeat: 3 });
  }
}
