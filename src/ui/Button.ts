import Phaser from 'phaser';
import { PixelText } from './PixelText';

/** A framed text button; disabled buttons are dimmed and ignore clicks. */
export function button(scene: Phaser.Scene, x: number, y: number, w: number, label: string, onClick: () => void, enabled = true) {
  const box = scene.add
    .rectangle(x, y, w, 24, 0x2c2c3a)
    .setStrokeStyle(2, enabled ? 0xe6b422 : 0x55556e);
  const text = new PixelText(scene, x, y + 1, label, { color: enabled ? '#ffffff' : '#6a6a80' }).setOrigin(0.5);
  if (enabled) {
    box.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
    box.on('pointerover', () => box.setFillStyle(0x3a3a4e)).on('pointerout', () => box.setFillStyle(0x2c2c3a));
  }
  return { box, text };
}
