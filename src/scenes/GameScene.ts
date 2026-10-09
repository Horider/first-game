import Phaser from 'phaser';
import { DEBUG, STEP, VIEW } from '../config';
import { canPlace, collectCoin, placeDefender, setPaused } from '../core/commands';
import { createState, drainEvents, type GameState } from '../core/GameState';
import { tick } from '../core/Simulation';
import { startWave } from '../core/systems/waves';
import { starsFor } from '../core/systems/outcome';
import type { DefenderType } from '../data/defenders';
import { LEVELS } from '../data/levels';
import { tinyText } from '../ui/tinyFont';
import { EntityViews } from '../view/EntityViews';
import { Hud } from '../view/Hud';
import { cellAt, cellX, rowY } from '../view/layout';

/** Runs one level: turns input into commands, ticks the simulation and keeps the views in sync. */
export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private views!: EntityViews;
  private hud!: Hud;
  private cursor!: Phaser.GameObjects.Rectangle;
  private debugText?: Phaser.GameObjects.BitmapText;
  private accumulator = 0;
  private speed = 1;
  private finished = false;

  constructor() {
    super('game');
  }

  create() {
    this.state = createState(LEVELS[0]);
    if (DEBUG) (window as unknown as { gameState: GameState }).gameState = this.state;
    this.accumulator = 0;
    this.speed = 1;
    this.finished = false;

    this.add.image(0, VIEW.panelHeight, 'board').setOrigin(0);
    this.cursor = this.add.rectangle(0, 0, VIEW.cell, VIEW.cell).setOrigin(0).setDepth(5).setVisible(false);

    this.views = new EntityViews(this, (id) => collectCoin(this.state, id));
    this.hud = new Hud(
      this,
      (type) => this.selectCard(type),
      () => this.togglePause(),
    );

    // The board itself: a click places the selected defender. Coins sit above it and win the click.
    const board = this.add
      .zone(VIEW.boardX, VIEW.panelHeight, VIEW.width - VIEW.boardX, VIEW.height - VIEW.panelHeight)
      .setOrigin(0)
      .setInteractive();
    board.on('pointerdown', (p: Phaser.Input.Pointer) => this.clickBoard(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.moveCursor(p));
    this.input.mouse?.disableContextMenu();

    const keys = this.input.keyboard!;
    keys.on('keydown-SPACE', () => this.togglePause());
    keys.on('keydown-ESC', () => this.selectCard(null));
    if (DEBUG) this.setupDebug(keys);

    // Leaving the tab pauses the level so drops do not walk in while nobody is looking.
    const onHidden = () => {
      if (this.state.status === 'playing') this.togglePause();
    };
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden));

    this.hud.showBanner('Ставь\nзащитников!');
  }

  update(time: number, delta: number) {
    if (this.state.status === 'playing') {
      this.accumulator += Math.min(delta / 1000, 0.25) * this.speed;
      while (this.accumulator >= STEP && this.state.status === 'playing') {
        tick(this.state, STEP);
        this.accumulator -= STEP;
      }
    }
    this.handleEvents();
    this.views.sync(this.state, time);
    this.hud.sync(this.state);
    if (this.debugText) {
      const w = this.state.wave;
      this.debugText.setText(`t${this.state.time.toFixed(0)} w${w.index + 1}/${this.state.level.waves.length} ${w.phase[0]} x${this.speed}`);
    }
  }

  private handleEvents() {
    const events = drainEvents(this.state);
    this.views.handle(events);
    for (const ev of events) {
      switch (ev.type) {
        case 'waveStarted':
          if (ev.big) this.hud.showBanner('Большая\nволна!', '#ff6b6b');
          else this.hud.showBanner(`Волна ${ev.wave}`);
          break;
        case 'heartLost':
          this.hud.shakeHeart(ev.hearts);
          this.cameras.main.shake(150, 0.02);
          break;
        case 'won':
        case 'lost':
          this.finish();
          break;
      }
    }
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.selectCard(null);
    this.hud.hideBanner();
    this.time.delayedCall(600, () => {
      this.scene.launch('result', { won: this.state.status === 'won', stars: this.state.stars });
    });
  }

  private selectCard(type: DefenderType | null) {
    this.hud.selected = type && this.hud.selected !== type ? type : null;
    this.updateCursor(this.input.activePointer);
  }

  private togglePause() {
    if (this.finished) return;
    const paused = this.state.status === 'paused';
    setPaused(this.state, !paused);
    if (paused) this.hud.hideBanner();
    else this.hud.showBanner('Пауза', '#ffffff', true);
  }

  private clickBoard(p: Phaser.Input.Pointer) {
    const type = this.hud.selected;
    const cell = cellAt(p.worldX, p.worldY);
    if (!type || !cell) return;
    const result = placeDefender(this.state, type, cell.row, cell.col);
    if (result === 'ok') {
      this.hud.selected = null;
      this.cursor.setVisible(false);
    } else {
      this.cameras.main.shake(80, 0.01);
    }
  }

  private moveCursor(p: Phaser.Input.Pointer) {
    this.updateCursor(p);
  }

  /** Green frame where the selected defender can stand, red where it cannot. */
  private updateCursor(p: Phaser.Input.Pointer) {
    const type = this.hud.selected;
    const cell = cellAt(p.worldX, p.worldY);
    if (!type || !cell) {
      this.cursor.setVisible(false);
      return;
    }
    const ok = canPlace(this.state, type, cell.row, cell.col) === 'ok';
    this.cursor
      .setPosition(cellX(cell.col), rowY(cell.row))
      .setStrokeStyle(1, ok ? 0x9dff6b : 0xff4a4a)
      .setFillStyle(ok ? 0x9dff6b : 0xff4a4a, 0.25)
      .setVisible(true);
  }

  private setupDebug(keys: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.debugText = tinyText(this, VIEW.boardX + 1, VIEW.height - 6, '').setDepth(200);
    keys.on('keydown-ONE', () => (this.speed = 1));
    keys.on('keydown-TWO', () => (this.speed = 2));
    keys.on('keydown-THREE', () => (this.speed = 4));
    keys.on('keydown-M', () => (this.state.coins += 1000));
    keys.on('keydown-N', () => {
      if (this.state.wave.phase === 'break') startWave(this.state);
    });
    keys.on('keydown-W', () => {
      if (this.finished) return;
      this.state.status = 'won';
      this.state.stars = starsFor(this.state.heartsLost);
      this.finish();
    });
  }
}
