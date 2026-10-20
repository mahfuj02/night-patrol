import { CanvasTexture, SRGBColorSpace } from 'three';
import { world } from '@/lib/palette';

/**
 * The licence plate as a small canvas texture: our own stylised plate (a light face, a dark border and
 * dark letters in a plain sans face), not a copy of any real plate. The text comes from content.
 */
export function createPlateTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = world.plateBg;
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = world.plateInk;
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, 250, 58);
    ctx.fillStyle = world.plateInk;
    ctx.font = '600 38px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 34);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
