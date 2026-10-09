import Phaser from 'phaser';
import { COLS, DEBUG, ROWS, STEP, VIEW } from '../config';
import { canPlace, collectCoin, placeDefender, setPaused, upgradeDefender } from '../core/commands';
import { createState, defenderAt, drainEvents, type GameState } from '../core/GameState';
import { tick } from '../core/Simulation';
import { startWave } from '../core/systems/waves';
import { starsFor } from '../core/systems/outcome';
import type { DefenderType } from '../data/defenders';
import { LEVELS, type LevelDef } from '../data/levels';
import { recordWin } from '../save/storage';
import { tinyText } from '../ui/tinyFont';
import { EntityViews } from '../view/EntityViews';
import { Hud } from '../view/Hud';
import { InfoPanel } from '../view/InfoPanel';
import { cellAt, cellX, rowY } from '../view/layout';

export interface GameSceneData {
  levelId?: number;
}

/** Runs one level: turns input into commands, ticks the simulation and keeps the views in sync. */
export class GameScene extends Phaser.Scene {
  private level!: LevelDef;
  private state!: GameState;
  private views!: EntityViews;
  private hud!: Hud;
  private info!: InfoPanel;
  private cursor!: Phaser.GameObjects.Rectangle;
  private debugText?: Phaser.GameObjects.BitmapText;
  private accumulator = 0;
  private speed = 1;
  private finished = false;

  constructor() {
    super('game');
  }

  create(data: GameSceneData) {
    this.level = LEVELS.find((l) => l.id === data.levelId) ?? LEVELS[0];
    this.state = createState(this.level);
    if (DEBUG) (window as unknown as { gameState: GameState }).gameState = this.state;
    this.accumulator = 0;
    this.speed = 1;
    this.finished = false;

    this.add.image(0, VIEW.panelHeight, 'board').setOrigin(0);
    for (let row = 0; row < ROWS; row++) this.add.image(0, rowY(row), 'wall').setOrigin(0);
    // Portals glow, each lane out of step with the next.
    for (let row = 0; row < ROWS; row++) {
      const glow = this.add
        .rectangle(cellX(COLS) + VIEW.cell / 2, rowY(row) + VIEW.cell / 2, 12, 20, 0xe7b3ff, 1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0);
      this.tweens.add({ targets: glow, alpha: 0.35, duration: 700, delay: row * 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.cursor = this.add.rectangle(0, 0, VIEW.cell, VIEW.cell).setOrigin(0).setDepth(5).setVisible(false);

    this.views = new EntityViews(
      this,
      (id) => collectCoin(this.state, id),
      (type, pointer) => (this.hud.selected ? this.clickBoard(pointer) : this.info.showEnemy(type)),
    );
    this.hud = new Hud(
      this,
      `${this.level.id}. ${this.level.name}`,
      (type) => this.selectCard(type),
      () => this.togglePause(),
      (speed) => (this.speed = speed),
      (type) => (type ? this.info.showDefender(type) : this.syncInfo()),
    );
    this.info = new InfoPanel(this);

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
    keys.on('keydown-ONE', () => (this.speed = 1));
    keys.on('keydown-TWO', () => (this.speed = 2));
    keys.on('keydown-THREE', () => (this.speed = 3));
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
    this.hud.sync(this.state, this.speed);
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
      const won = this.state.status === 'won';
      if (won) recordWin(this.level.id, this.state.stars);
      this.scene.launch('result', { won, stars: this.state.stars, levelId: this.level.id });
    });
  }

  private selectCard(type: DefenderType | null) {
    this.hud.selected = type && this.hud.selected !== type ? type : null;
    this.syncInfo();
    this.updateCursor(this.input.activePointer);
  }

  /** The info panel follows the selected card. */
  private syncInfo() {
    if (this.hud.selected) this.info.showDefender(this.hud.selected);
    else this.info.hide();
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
    if (!cell) return;
    if (!type) {
      // No card in hand: clicking a level-1 defender upgrades it.
      const d = defenderAt(this.state, cell.row, cell.col);
      if (d && upgradeDefender(this.state, d.id) === 'noCoins') this.cameras.main.shake(80, 0.005);
      return;
    }
    const result = placeDefender(this.state, type, cell.row, cell.col);
    if (result === 'ok') {
      this.hud.selected = null;
      this.syncInfo();
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
    this.debugText = tinyText(this, VIEW.boardX + 2, VIEW.height - 7, '').setDepth(200);
    keys.on('keydown-M', () => (this.state.coins += 1000));
    keys.on('keydown-N', () => {
      if (this.state.wave.phase === 'break') startWave(this.state);
    });
    keys.on('keydown-L', () => {
      // Lose instantly, to check the defeat screen.
      this.state.hearts = 0;
    });
    keys.on('keydown-W', () => {
      if (this.finished) return;
      this.state.status = 'won';
      this.state.stars = starsFor(this.state.heartsLost);
      this.finish();
    });
  }
}
