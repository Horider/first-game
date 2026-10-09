import Phaser from 'phaser';
import { DEBUG, VIEW } from '../config';
import { canUpgrade } from '../core/commands';
import type { GameEvent } from '../core/events';
import type { GameState } from '../core/GameState';
import { DEFENDERS } from '../data/defenders';
import { ENEMIES } from '../data/enemies';
import { cellX, PURSE, rowY } from './layout';

const DEPTH = { defender: 10, enemy: 20, arrow: 30, bars: 40, coin: 50 };
const HALF = VIEW.cell / 2;

/**
 * Keeps one sprite per defender, slime, arrow and coin in step with the game state.
 * Sprites are created on first sight and removed (or animated away) when the
 * object leaves the state.
 */
export class EntityViews {
  private defenders = new Map<number, Phaser.GameObjects.Image>();
  private badges = new Map<number, Phaser.GameObjects.Image>();
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
        case 'defenderUpgraded': {
          const img = this.defenders.get(ev.id);
          if (!img) break;
          img.setTexture(DEFENDERS[ev.defender].sprite).setTintFill(0x00ff8c);
          this.scene.tweens.add({ targets: img, scaleY: 1.25, duration: 120, yoyo: true, onComplete: () => img.clearTint() });
          break;
        }
        case 'enemyHit':
          this.flash(this.enemies.get(ev.id), ev.id, 0.08);
          break;
        case 'defenderHit':
          this.flash(this.defenders.get(ev.id), ev.id, 0.08, 0.5);
          break;
        case 'arrowFired': {
          const archer = this.defenders.get(ev.from);
          if (archer) this.scene.tweens.add({ targets: archer, scaleX: 0.9, duration: 60, yoyo: true });
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
      img.setPosition(cellX(d.col) + HALF, rowY(d.row) + VIEW.cell);

      // A green arrow over level-1 defenders the player can afford to upgrade.
      const upgradable = canUpgrade(state, d.id) === 'ok';
      let badge = this.badges.get(d.id);
      if (upgradable && !badge) {
        badge = this.scene.add.image(0, 0, 'upgrade').setOrigin(0).setDepth(DEPTH.bars + 1);
        this.badges.set(d.id, badge);
      } else if (!upgradable && badge) {
        badge.destroy();
        this.badges.delete(d.id);
        badge = undefined;
      }
      badge?.setPosition(cellX(d.col) + VIEW.cell - 8, rowY(d.row) + 1 - (Math.floor(time / 300) % 2));
    }
    this.prune(this.defenders, seen);
    this.prune(this.badges, seen);

    for (const e of state.enemies) {
      seen.add(e.id);
      let img = this.enemies.get(e.id);
      if (!img) {
        img = this.scene.add.image(0, 0, ENEMIES[e.type].sprite).setOrigin(0.5, 1).setDepth(DEPTH.enemy + e.row);
        this.enemies.set(e.id, img);
      }
      // Walking slimes hop; chewing slimes squash and stretch.
      const phase = Math.floor(time / 200 + e.id) % 2;
      const bob = e.state === 'walk' ? phase * 2 : 0;
      img.setScale(e.state === 'attack' && phase ? 1.1 : 1, e.state === 'attack' && phase ? 0.9 : 1);
      img.setPosition(Math.round(cellX(e.x)) + HALF, rowY(e.row) + VIEW.cell - bob);
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
      img.setPosition(Math.round(cellX(p.x)), rowY(p.row) + 14);
    }
    this.prune(this.arrows, seen);

    for (const c of state.drops) {
      seen.add(c.id);
      let img = this.coins.get(c.id);
      if (!img) {
        const x = Math.round(cellX(c.x));
        const y = rowY(c.row) + HALF;
        img = this.scene.add.image(x, y, 'coin').setScale(2).setDepth(DEPTH.coin);
        // Generous hit box so the coin is easy to tap on a phone.
        img.setInteractive(new Phaser.Geom.Rectangle(-6, -6, 18, 17), Phaser.Geom.Rectangle.Contains);
        img.on('pointerdown', () => this.onCoinClick(c.id));
        this.scene.tweens.add({ targets: img, y: y - 10, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
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
      const w = 20;
      const fill = Math.max(1, Math.round((w * Math.max(0, hp)) / max));
      g.fillStyle(0x14141c).fillRect(x - w / 2 - 1, y - 1, w + 2, 4);
      g.fillStyle(color).fillRect(x - w / 2, y, fill, 2);
    };
    for (const d of state.defenders) bar(cellX(d.col) + HALF, rowY(d.row) + 1, d.hp, d.maxHp, 0x5fe05a);
    for (const e of state.enemies) bar(Math.round(cellX(e.x)) + HALF, rowY(e.row) + 1, e.hp, e.maxHp, 0xff5a5a);
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
