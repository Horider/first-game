import '@fontsource/press-start-2p/cyrillic-400.css';
import '@fontsource/press-start-2p/latin-400.css';
import Phaser from 'phaser';
import { VIEW } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { ResultScene } from './scenes/ResultScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW.width,
  height: VIEW.height,
  backgroundColor: '#14141c',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, GameScene, ResultScene],
});

/**
 * Zoom so every game pixel covers a whole number of screen (device) pixels and stays sharp.
 * On big screens the game takes about 70% of the window; small phones get the largest fit.
 */
function fitZoom() {
  const dpr = window.devicePixelRatio || 1;
  const fit = (share: number) => Math.min((window.innerWidth * share) / VIEW.width, (window.innerHeight * share) / VIEW.height);
  const zoom = fit(0.7) >= 2 ? fit(0.7) : fit(1);
  game.scale.setZoom(Math.max(1, Math.floor(zoom * dpr)) / dpr);
}
window.addEventListener('resize', fitZoom);
game.events.once(Phaser.Core.Events.READY, fitZoom);
