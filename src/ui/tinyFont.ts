import Phaser from 'phaser';

export const TINY_FONT = 'tiny';

/** 3×5 glyphs for small numbers in the panel (Press Start 2P is 8 px, too big for a card). */
const GLYPHS: Record<string, string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '.##', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  x: ['...', '#.#', '.#.', '#.#', '...'],
  '/': ['..#', '..#', '.#.', '#..', '#..'],
  ':': ['...', '.#.', '...', '.#.', '...'],
  '.': ['...', '...', '...', '...', '.#.'],
  t: ['.#.', '###', '.#.', '.#.', '.##'],
  w: ['...', '#.#', '#.#', '###', '#.#'],
  b: ['#..', '#..', '###', '#.#', '###'],
  s: ['...', '.##', '#..', '..#', '##.'],
  c: ['...', '###', '#..', '#..', '###'],
  d: ['..#', '..#', '###', '#.#', '###'],
  ' ': ['...', '...', '...', '...', '...'],
};

/** Draws the glyph sheet once and registers it as a bitmap font. */
export function createTinyFont(scene: Phaser.Scene) {
  const chars = Object.keys(GLYPHS).join('');
  const texture = scene.textures.createCanvas('tiny-font', chars.length * 3, 5)!;
  const ctx = texture.getContext();
  ctx.fillStyle = '#ffffff';
  [...chars].forEach((ch, i) =>
    GLYPHS[ch].forEach((line, y) => [...line].forEach((px, x) => px === '#' && ctx.fillRect(i * 3 + x, y, 1, 1))),
  );
  texture.refresh();
  const config = { image: 'tiny-font', width: 3, height: 5, chars, charsPerRow: chars.length, lineSpacing: 1 };
  const data = Phaser.GameObjects.RetroFont.Parse(scene, config as unknown as Phaser.Types.GameObjects.BitmapText.RetroFontConfig);
  scene.cache.bitmapFont.add(TINY_FONT, data);
}

export function tinyText(scene: Phaser.Scene, x: number, y: number, text: string) {
  return scene.add.bitmapText(x, y, TINY_FONT, text).setLetterSpacing(1);
}
