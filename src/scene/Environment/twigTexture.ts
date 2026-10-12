import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace } from 'three';
import { drawTwigs } from '@/lib/branches';

/**
 * A sprig of fine twigs, white on black, used as an alpha map on the small planes at branch
 * tips. Drawn once in the browser by the procedural generator, so there is no image file to
 * ship. Mipmaps stay on so distant twigs fade softly instead of shimmering. The caller disposes
 * the texture.
 */
export function createTwigTexture(size: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#000';
    context.fillRect(0, 0, size, size);
    context.strokeStyle = '#fff';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    drawTwigs(context, size, 21);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  return texture;
}
