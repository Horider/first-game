import Phaser from 'phaser';

export const FONT = '"Press Start 2P"';

/**
 * Canvas text is always anti-aliased. At our 176×108 native size that turns into blurry
 * grey edges once the canvas is scaled up, so after every redraw we snap each pixel's
 * alpha to fully on or off and re-upload the texture.
 */
export class PixelText extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    super(scene, x, y, text, { fontFamily: FONT, fontSize: '8px', color: '#ffffff', ...style });
    scene.add.existing(this);
  }

  override updateText(): this {
    super.updateText();
    const { canvas, context } = this;
    if (canvas.width === 0 || canvas.height === 0) return this;
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const px = image.data;
    // ImageData is not premultiplied, so a half-covered pixel already holds the full colour.
    for (let i = 3; i < px.length; i += 4) px[i] = px[i] >= 110 ? 255 : 0;
    context.putImageData(image, 0, 0);
    const renderer = this.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (renderer && renderer.gl) {
      this.frame.source.glTexture = renderer.canvasToTexture(canvas, this.frame.source.glTexture ?? undefined, true);
    }
    return this;
  }
}
