import { CanvasTexture, SRGBColorSpace } from 'three';
import { world } from '@/lib/palette';

/**
 * The face of a stop sign: red with a white border and the lettering, drawn on a canvas. The
 * octagon is cut out by the sign geometry, so the canvas only has to fill the circle around it
 * (the cap of an eight-sided cylinder maps the texture onto its circumscribed circle).
 */
export function createStopSignTexture(text: string, size = 256): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = world.signRed;
    ctx.fillRect(0, 0, size, size);
    // The cap of the cylinder maps the canvas turned by 67.5 degrees (a quarter turn from its uv
    // axes, plus the 22.5 degrees the octagon is turned to stand on a flat side), so draw turned
    // back by the same amount and the lettering reads level on the sign.
    ctx.translate(size / 2, size / 2);
    ctx.rotate((-3 * Math.PI) / 8);
    // White border: a slightly smaller octagon, flat side up.
    ctx.strokeStyle = '#F2F2F2';
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const angle = (k + 0.5) * (Math.PI / 4);
      const radius = size * 0.45;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#F2F2F2';
    ctx.font = `bold ${Math.round(size * 0.27)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, size * 0.02);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
