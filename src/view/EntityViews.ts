import Phaser from 'phaser';
import { DEBUG } from '../config';
import type { GameEvent } from '../core/events';
import type { GameState } from '../core/GameState';
import { DEFENDERS } from '../data/defenders';
import { ENEMIES } from '../data/enemies';
import { cellX, PURSE, rowY } from './layout';

const DEPTH = { defender: 10, enemy: 20, arrow: 30, bars: 40, coin: 50 };

/**
 * Keeps one sprite per defender, drop, arrow and coin in step with the game state.
 * Sprites are created on first sight and removed (or animated away) when the
 * object leaves the state.
 */
export class EntityViews {
  private defenders = new Map<number, Phaser.GameObjects.Image>();
  private enemies = new Map<number, Phaser.GameObjects.Image>();
  private arrows = new Map<number, Phaser.GameObjects.Image>();
  private coins = new Map<number, Phaser.GameObjects.Image>();
  private flashUntil = new Map<number, number>();
  private bars: Phaser.GameObjects.Graphics;

  constructor(
    private scene: Phaser.Scene,
    private onCoinClick: (id: number) => void,
  ) {
    this.bars = scene.add.graphics().setDepth(DEPTH.bars);
  }

  handle(events: GameEvent[]) {
    for (const ev of events) {
      switch (ev.type) {
        case 'enemyKilled':
          this.vanish(this.enemies, ev.id);
          break;
        case 'defenderDied':
          this.vanish(this.defenders, ev.id);
          break;
        case 'enemyHit':
          this.flash(this.enemies.get(ev.id), ev.id, 0.08);
          break;
        case 'defenderHit':
          this.flash(this.defenders.get(ev.id), ev.id, 0.08, 0.5);
          break;
        case 'arrowFired': {
          const archer = this.defenders.get(ev.from);
          if (archer) this.scene.tweens.add({ targets: archer, scaleX: 0.85, duration: 60, yoyo: true });
          break;
        }
        case 'coinCollected': {
          const coin = this.coins.get(ev.id);
          if (!coin) break;
          this.coins.delete(ev.id);
          coin.disableInteractive();
          this.scene.tweens.killTweensOf(coin);
          this.scene.tweens.add({
            targets: coin,
            x: PURSE.x,
            y: PURSE.y,
            alpha: 1,
            duration: ev.auto ? 500 : 300,
            ease: 'Quad.easeIn',
            onComplete: () => coin.destroy(),
          });
          break;
        }
      }
    }
  }

  sync(state: GameState, time: number) {
    const seen = new Set<number>();

    for (const d of state.defenders) {
      seen.add(d.id);
      let img = this.defenders.get(d.id);
      if (!img) {
        img = this.scene.add.image(0, 0, DEFENDERS[d.type].sprite).setOrigin(0.5, 1).setDepth(DEPTH.defender + d.row);
        img.setScale(1, 0.3);
        this.scene.tweens.add({ targets: img, scaleY: 1, duration: 150, ease: 'Back.easeOut' });
        this.defenders.set(d.id, img);
      }
      img.setPosition(cellX(d.col) + 8, rowY(d.row) + 16);
    }
    this.prune(this.defenders, seen);

    for (const e of state.enemies) {
      seen.add(e.id);
      let img = this.enemies.get(e.id);
      if (!img) {
        img = this.scene.add.image(0, 0, ENEMIES[e.type].sprite).setOrigin(0.5, 1).setDepth(DEPTH.enemy + e.row);
        this.enemies.set(e.id, img);
      }
      // Walking drops hop a pixel; chewing drops squash and stretch.
      const phase = Math.floor(time / 200 + e.id) % 2;
      const bob = e.state === 'walk' ? phase : 0;
      img.setScale(e.state === 'attack' && phase ? 1.12 : 1, e.state === 'attack' && phase ? 0.88 : 1);
      img.setPosition(Math.round(cellX(e.x)) + 8, rowY(e.row) + 16 - bob);
      // Fade in while leaving the portal.
      img.setAlpha(Math.min(1, Math.max(0.3, (9.6 - e.x) / 0.6)));
    }
    this.prune(this.enemies, seen);

    for (const p of state.projectiles) {
      seen.add(p.id);
      let img = this.arrows.get(p.id);
      if (!img) {
        img = this.scene.add.image(0, 0, 'arrow').setOrigin(0, 0.5).setDepth(DEPTH.arrow);
        this.arrows.set(p.id, img);
      }
      img.setPosition(Math.round(cellX(p.x)), rowY(p.row) + 8);
    }
    this.prune(this.arrows, seen);

    for (const c of state.drops) {
      seen.add(c.id);
      let img = this.coins.get(c.id);
      if (!img) {
        const x = Math.round(cellX(c.x));
        const y = rowY(c.row) + 8;
        img = this.scene.add.image(x, y, 'coin').setDepth(DEPTH.coin);
        // Generous hit box so the coin is easy to tap on a phone.
        img.setInteractive(new Phaser.Geom.Rectangle(-4, -4, 18, 18), Phaser.Geom.Rectangle.Contains);
        img.on('pointerdown', () => this.onCoinClick(c.id));
        this.scene.tweens.add({ targets: img, y: y - 6, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
        this.coins.set(c.id, img);
      }
      // Blink during the last second before it flies away on its own.
      img.setAlpha(c.age > 4 && Math.floor(time / 100) % 2 ? 0.4 : 1);
    }
    for (const [id, img] of this.coins) if (!seen.has(id)) (img.destroy(), this.coins.delete(id));

    this.drawBars(state);
    this.updateFlashes(time);
  }

  /** Health bars over anyone who is hurt (always in debug mode). */
  private drawBars(state: GameState) {
    const g = this.bars.clear();
    const bar = (x: number, y: number, hp: number, max: number, color: number) => {
      if (hp >= max && !DEBUG) return;
      const w = 10;
      const fill = Math.max(1, Math.round((w * Math.max(0, hp)) / max));
      g.fillStyle(0x14141c).fillRect(x - 6, y - 1, w + 2, 3);
      g.fillStyle(color).fillRect(x - 5, y, fill, 1);
    };
    for (const d of state.defenders) bar(cellX(d.col) + 8, rowY(d.row), d.hp, d.maxHp, 0x5fe05a);
    for (const e of state.enemies) bar(Math.round(cellX(e.x)) + 8, rowY(e.row), e.hp, e.maxHp, 0xff5a5a);
  }

  private flash(img: Phaser.GameObjects.Image | undefined, id: number, seconds: number, minGap = 0) {
    if (!img) return;
    const now = this.scene.time.now;
    const until = this.flashUntil.get(id) ?? 0;
    if (now < until + minGap * 1000) return;
    this.flashUntil.set(id, now + seconds * 1000);
    img.setTintFill(0xffffff);
  }

  private updateFlashes(time: number) {
    for (const [id, until] of this.flashUntil) {
      if (time < until) continue;
      this.defenders.get(id)?.clearTint();
      this.enemies.get(id)?.clearTint();
      if (time > until + 1000) this.flashUntil.delete(id);
    }
  }

  private vanish(map: Map<number, Phaser.GameObjects.Image>, id: number) {
    const img = map.get(id);
    if (!img) return;
    map.delete(id);
    img.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: img,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 0.4,
      duration: 220,
      onComplete: () => img.destroy(),
    });
  }

  private prune(map: Map<number, Phaser.GameObjects.Image>, seen: Set<number>) {
    for (const [id, img] of map) {
      if (seen.has(id)) continue;
      img.destroy();
      map.delete(id);
    }
  }
}
