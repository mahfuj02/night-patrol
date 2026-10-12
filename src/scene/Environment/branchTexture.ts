import { CanvasTexture, LinearFilter, NoColorSpace } from 'three';
import { drawBranches } from '@/lib/branches';

/**
 * White branches on black, used as an alpha map: the tree silhouette. Drawn once in the browser
 * from the procedural branch generator, so there is no image file to ship. Mipmaps are off so the
 * thin twigs stay crisp instead of fading away with distance. The caller disposes the texture.
 */
export function createBranchTexture(size: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#000';
    context.fillRect(0, 0, size, size);
    context.strokeStyle = '#fff';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    drawBranches(context, size, 11);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
}
