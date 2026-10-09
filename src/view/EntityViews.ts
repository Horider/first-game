import Phaser from 'phaser';
import { DEBUG, VIEW } from '../config';
import { canUpgrade } from '../core/commands';
import type { GameEvent } from '../core/events';
import type { GameState } from '../core/GameState';
import { DEFENDERS } from '../data/defenders';
import { ENEMIES, type EnemyType } from '../data/enemies';
import { cellX, PURSE, rowY } from './layout';

const DEPTH = { defender: 10, enemy: 20, arrow: 30, bars: 40, coin: 50 };
const HALF = VIEW.cell / 2;

/** Offsets that event tweens animate (a lunge, a recoil) on top of the idle or walk motion. */
interface Pose {
  dx: number;
  angle: number;
  squash: number;
}

interface Unit {
  img: Phaser.GameObjects.Image;
  pose: Pose;
}

/** Slime bodies with legs wobble side to side; round slimes squash and stretch instead. */
const LEGGED = new Set<EnemyType>(['slimebody', 'twins']);

/**
 * Keeps one sprite per defender, slime, arrow and coin in step with the game state, and
 * animates them: idle breathing, walking, attacks, hits, deaths. The 32rogues sprites have a
 * single frame, so all motion is done with position, scale and rotation.
 */
export class EntityViews {
  private defenders = new Map<number, Unit>();
  private badges = new Map<number, Phaser.GameObjects.Image>();
  private enemies = new Map<number, Unit>();
  private arrows = new Map<number, Phaser.GameObjects.Image>();
  private coins = new Map<number, Phaser.GameObjects.Image>();
  private flashUntil = new Map<number, number>();
  private bars: Phaser.GameObjects.Graphics;

  constructor(
    private scene: Phaser.Scene,
    private onCoinClick: (id: number) => void,
    private onEnemyClick: (type: EnemyType, pointer: Phaser.Input.Pointer) => void,
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
          const unit = this.defenders.get(ev.id);
          if (!unit) break;
          unit.img.setTexture(DEFENDERS[ev.defender].sprite).setTintFill(0x00ff8c);
          this.scene.tweens.add({ targets: unit.pose, squash: -0.25, duration: 120, yoyo: true, onComplete: () => unit.img.clearTint() });
          break;
        }
        case 'enemyHit': {
          const unit = this.enemies.get(ev.id);
          this.flash(unit?.img, ev.id, 0.08);
          // Knock the slime back a little.
          if (unit) this.pulse(unit.pose, { dx: 3 }, 70);
          break;
        }
        case 'defenderHit': {
          const unit = this.defenders.get(ev.id);
          if (this.flash(unit?.img, ev.id, 0.08, 0.5) && unit) this.pulse(unit.pose, { dx: -2 }, 60);
          break;
        }
        case 'arrowFired': {
          // Draw the bow: lean back, then spring forward.
          const unit = this.defenders.get(ev.from);
          if (unit) this.pulse(unit.pose, { dx: -3, squash: 0.08 }, 80);
          break;
        }
        case 'meleeHit': {
          // Lunge and swing towards the slime.
          const unit = this.defenders.get(ev.from);
          if (unit) this.pulse(unit.pose, { dx: 7, angle: 12 }, 90);
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
            scaleX: 2,
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
    const t = time / 1000;

    for (const d of state.defenders) {
      seen.add(d.id);
      let unit = this.defenders.get(d.id);
      if (!unit) {
        const img = this.scene.add.image(0, 0, DEFENDERS[d.type].sprite).setOrigin(0.5, 1).setDepth(DEPTH.defender + d.row);
        unit = { img, pose: { dx: 0, angle: 0, squash: -0.7 } };
        // Pop up out of the ground.
        this.scene.tweens.add({ targets: unit.pose, squash: 0, duration: 200, ease: 'Back.easeOut' });
        this.defenders.set(d.id, unit);
      }
      // Idle: slow breathing, each defender a little out of step with the others.
      const breath = Math.sin(t * 2.4 + d.id) * 0.03;
      this.place(unit, cellX(d.col) + HALF, rowY(d.row) + VIEW.cell, breath);

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
    this.pruneUnits(this.defenders, seen);
    this.prune(this.badges, seen);

    for (const e of state.enemies) {
      seen.add(e.id);
      let unit = this.enemies.get(e.id);
      if (!unit) {
        const img = this.scene.add.image(0, 0, ENEMIES[e.type].sprite).setOrigin(0.5, 1).setDepth(DEPTH.enemy + e.row);
        img.setInteractive().on('pointerdown', (p: Phaser.Input.Pointer) => this.onEnemyClick(e.type, p));
        unit = { img, pose: { dx: 0, angle: 0, squash: 0 } };
        this.enemies.set(e.id, unit);
      }
      const phase = t * (e.state === 'walk' ? 6 : 9) + e.id;
      let y = rowY(e.row) + VIEW.cell;
      let squash = 0;
      let angle = 0;
      let dx = 0;
      if (LEGGED.has(e.type)) {
        // Waddle: tilt from side to side, step up on each foot.
        angle = Math.sin(phase) * (e.state === 'walk' ? 6 : 3);
        y -= Math.abs(Math.sin(phase)) * 2;
        if (e.state === 'attack') dx = -Math.max(0, Math.sin(phase)) * 4; // punching the defender
      } else {
        // Jelly: squash on landing, stretch while hopping.
        squash = Math.sin(phase) * (e.state === 'walk' ? 0.12 : 0.18);
        if (e.state === 'walk') y -= Math.max(0, Math.sin(phase)) * 3;
        else dx = -Math.max(0, Math.sin(phase)) * 3; // gnawing at the defender
      }
      unit.img.setAlpha(Math.min(1, Math.max(0.3, (9.6 - e.x) / 0.6))); // fade in from the portal
      this.place(unit, Math.round(cellX(e.x)) + HALF + dx, y, squash, angle);
    }
    this.pruneUnits(this.enemies, seen);

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
      // Spin, and blink during the last second before it flies away on its own.
      img.scaleX = 2 * Math.max(0.15, Math.abs(Math.cos(t * 4 + c.id)));
      img.setAlpha(c.age > 4 && Math.floor(time / 100) % 2 ? 0.4 : 1);
    }
    for (const [id, img] of this.coins) if (!seen.has(id)) (img.destroy(), this.coins.delete(id));

    this.drawBars(state);
    this.updateFlashes(time);
  }

  /** Apply base motion plus the event pose; feet stay on the ground while squashing. */
  private place(unit: Unit, x: number, y: number, squash = 0, angle = 0) {
    const s = squash + unit.pose.squash;
    unit.img
      .setPosition(Math.round(x + unit.pose.dx), Math.round(y))
      .setScale(1 + s * 0.6, 1 - s)
      .setAngle(angle + unit.pose.angle);
  }

  /** Push a pose away from rest and let it spring back. */
  private pulse(pose: Pose, to: Partial<Pose>, duration: number) {
    this.scene.tweens.killTweensOf(pose);
    Object.assign(pose, { dx: 0, angle: 0, squash: 0 });
    this.scene.tweens.add({ targets: pose, ...to, duration, yoyo: true, ease: 'Quad.easeOut' });
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

  /** White hit flash; returns false when the unit flashed too recently. */
  private flash(img: Phaser.GameObjects.Image | undefined, id: number, seconds: number, minGap = 0): boolean {
    if (!img) return false;
    const now = this.scene.time.now;
    const until = this.flashUntil.get(id) ?? 0;
    if (now < until + minGap * 1000) return false;
    this.flashUntil.set(id, now + seconds * 1000);
    img.setTintFill(0xffffff);
    return true;
  }

  private updateFlashes(time: number) {
    for (const [id, until] of this.flashUntil) {
      if (time < until) continue;
      this.defenders.get(id)?.img.clearTint();
      this.enemies.get(id)?.img.clearTint();
      if (time > until + 1000) this.flashUntil.delete(id);
    }
  }

  /** Death: flash, flatten into a puddle and fade, with a few droplets for slimes. */
  private vanish(map: Map<number, Unit>, id: number) {
    const unit = map.get(id);
    if (!unit) return;
    map.delete(id);
    const img = unit.img.disableInteractive();
    this.scene.tweens.killTweensOf(unit.pose);
    img.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => img.clearTint());
    this.scene.tweens.add({ targets: img, scaleX: 1.5, scaleY: 0.25, angle: 0, alpha: 0, duration: 320, onComplete: () => img.destroy() });
    if (map === this.enemies) this.splash(img.x, img.y - 6);
  }

  private splash(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const drop = this.scene.add.image(x, y, 'pixel').setDisplaySize(2, 2).setTint(0x82a368).setDepth(DEPTH.arrow);
      const angle = Math.PI * (1.15 + (i / 5) * 0.7); // fan upwards
      this.scene.tweens.add({
        targets: drop,
        x: x + Math.cos(angle) * 14,
        y: y + Math.sin(angle) * 10,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => drop.destroy(),
      });
    }
  }

  private pruneUnits(map: Map<number, Unit>, seen: Set<number>) {
    for (const [id, unit] of map) {
      if (seen.has(id)) continue;
      this.scene.tweens.killTweensOf(unit.pose);
      unit.img.destroy();
      map.delete(id);
    }
  }

  private prune(map: Map<number, Phaser.GameObjects.Image>, seen: Set<number>) {
    for (const [id, img] of map) {
      if (seen.has(id)) continue;
      img.destroy();
      map.delete(id);
    }
  }
}
