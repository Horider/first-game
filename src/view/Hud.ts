import Phaser from 'phaser';
import { VIEW } from '../config';
import type { GameState } from '../core/GameState';
import { DEFENDERS, PROTOTYPE_CARDS, type DefenderType } from '../data/defenders';
import { PixelText } from '../ui/PixelText';
import { tinyText } from '../ui/tinyFont';
import { COLORS } from './textures';

const CARD = { x: 4, y: 2, w: 20, h: 24, gap: 2 };

interface CardView {
  type: DefenderType;
  frame: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  price: Phaser.GameObjects.BitmapText;
  shade: Phaser.GameObjects.Rectangle;
}

/** Top panel: defender cards, coin counter, hearts and the pause button. */
export class Hud {
  private cards: CardView[] = [];
  private coinText: PixelText;
  private hearts: Phaser.GameObjects.Image[] = [];
  private pauseButton: Phaser.GameObjects.Image;
  private banner: PixelText;
  private lastCoins = -1;
  selected: DefenderType | null = null;

  constructor(
    private scene: Phaser.Scene,
    onCard: (type: DefenderType) => void,
    onPause: () => void,
  ) {
    scene.add.rectangle(0, 0, VIEW.width, VIEW.panelHeight, COLORS.panel).setOrigin(0);

    PROTOTYPE_CARDS.forEach((type, i) => {
      const x = CARD.x + i * (CARD.w + CARD.gap);
      const frame = scene.add.graphics();
      const icon = scene.add.image(x + CARD.w / 2, CARD.y + 1, DEFENDERS[type].sprite).setOrigin(0.5, 0);
      const price = tinyText(scene, x + CARD.w / 2, CARD.y + CARD.h - 6, String(DEFENDERS[type].cost)).setOrigin(0.5, 0);
      // Cooldown curtain: drops from the top and shrinks as the card recharges.
      const shade = scene.add.rectangle(x + 1, CARD.y + 1, CARD.w - 2, CARD.h - 2, 0x000000, 0.6).setOrigin(0);
      const hit = scene.add.zone(x, CARD.y, CARD.w, CARD.h).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => onCard(type));
      this.cards.push({ type, frame, icon, price, shade });
    });

    scene.add.image(54, 9, 'coin').setOrigin(0);
    this.coinText = new PixelText(scene, 66, 10, '0', { color: COLORS.gold });

    for (let i = 0; i < 3; i++) this.hearts.push(scene.add.image(138 + i * 12, 10, 'heart').setOrigin(0));

    this.pauseButton = scene.add.image(117, 9, 'pause').setOrigin(0).setInteractive({ useHandCursor: true });
    this.pauseButton.on('pointerdown', onPause);

    this.banner = new PixelText(scene, VIEW.width / 2, VIEW.panelHeight + 40, '', {
      stroke: '#14141c',
      strokeThickness: 2,
      align: 'center',
    })
      .setOrigin(0.5)
      .setDepth(100)
      .setVisible(false);
  }

  sync(state: GameState) {
    for (const card of this.cards) {
      const def = DEFENDERS[card.type];
      const cooldown = state.cardCooldowns[card.type];
      const affordable = state.coins >= def.cost;
      const x = card.icon.x - CARD.w / 2;
      const selected = this.selected === card.type;
      card.frame
        .clear()
        .fillStyle(selected ? COLORS.cardSelected : COLORS.cardBorder)
        .fillRect(x, CARD.y, CARD.w, CARD.h)
        .fillStyle(COLORS.card)
        .fillRect(x + 1, CARD.y + 1, CARD.w - 2, CARD.h - 2);
      const left = cooldown / def.cooldown;
      card.shade.setVisible(cooldown > 0 || !affordable);
      card.shade.height = cooldown > 0 ? Math.ceil((CARD.h - 2) * left) : CARD.h - 2;
      card.price.setTint(affordable ? 0xffffff : 0xff6b6b);
    }

    if (state.coins !== this.lastCoins) {
      if (this.lastCoins >= 0 && state.coins > this.lastCoins) {
        this.scene.tweens.add({ targets: this.coinText, y: 9, duration: 60, yoyo: true });
      }
      this.coinText.setText(String(state.coins));
      this.lastCoins = state.coins;
    }

    this.hearts.forEach((h, i) => (i < state.hearts ? h.clearTint().setAlpha(1) : h.setTint(0x3a3a4a).setAlpha(0.8)));
    this.pauseButton.setTexture(state.status === 'paused' ? 'play' : 'pause');
  }

  /** Big centred message over the board. `hold` = stay until hidden. */
  showBanner(text: string, color = '#ffffff', hold = false) {
    this.scene.tweens.killTweensOf(this.banner);
    this.banner.setText(text).setColor(color).setVisible(true).setAlpha(1).setScale(1);
    if (hold) return;
    this.scene.tweens.add({ targets: this.banner, alpha: 0, delay: 1400, duration: 300, onComplete: () => this.banner.setVisible(false) });
  }

  hideBanner() {
    this.scene.tweens.killTweensOf(this.banner);
    this.banner.setVisible(false);
  }

  shakeHeart(index: number) {
    const heart = this.hearts[index];
    if (heart) this.scene.tweens.add({ targets: heart, y: 12, duration: 50, yoyo: true, repeat: 3 });
  }
}
