import { CanvasTexture, SRGBColorSpace } from 'three';
import { world } from '@/lib/palette';

function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** One arch-headed window: a rectangle with a semicircular top, as a path. */
function archPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

/**
 * The printed-heritage glass panel: frosted glass printed with a pale drawing of an old arched
 * brick facade. The drawing is our own (courses of brick, rows of arched windows with keystones, a
 * cornice), made up from scratch rather than traced from any photo. Light grey-white with cool
 * lines, so it glows brightest and coolest of the wall.
 */
export function createHeritagePanelTexture(width = 512, height = 768): CanvasTexture {
  return canvasTexture(width, height, (ctx) => {
    ctx.fillStyle = '#E4EAEE';
    ctx.fillRect(0, 0, width, height);

    // Courses of brick, as faint horizontal lines with offset joints.
    ctx.strokeStyle = 'rgba(120, 140, 155, 0.35)';
    ctx.lineWidth = 1.5;
    const course = height / 46;
    for (let row = 0; row < 46; row++) {
      const y = row * course;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      const brick = width / 8;
      for (let x = (row % 2) * (brick / 2); x < width; x += brick) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + course);
        ctx.stroke();
      }
    }

    // Four rows of three arched windows, the top row smaller.
    const columns = 3;
    const rows = 4;
    const cellW = width / columns;
    const cellH = (height * 0.86) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const w = cellW * (r === 0 ? 0.42 : 0.5);
        const h = cellH * (r === 0 ? 0.62 : 0.72);
        const x = c * cellW + (cellW - w) / 2;
        const y = height * 0.08 + r * cellH + (cellH - h) / 2;
        archPath(ctx, x, y, w, h);
        ctx.fillStyle = 'rgba(150, 175, 190, 0.55)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(90, 110, 125, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        // A mullion down the middle and a transom, like a sash window.
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + w / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h * 0.55);
        ctx.lineTo(x + w, y + h * 0.55);
        ctx.stroke();
        // The keystone.
        ctx.fillStyle = 'rgba(90, 110, 125, 0.6)';
        ctx.fillRect(x + w / 2 - 6, y - 5, 12, 12);
      }
    }

    // A cornice along the top and a plinth along the bottom.
    ctx.fillStyle = 'rgba(100, 120, 135, 0.7)';
    ctx.fillRect(0, 0, width, height * 0.035);
    ctx.fillRect(0, height * 0.965, width, height * 0.035);
  });
}

/**
 * The rooftop lettering: large serif capitals with hairline strikes through them, light on a
 * transparent background. The words come from `src/content` (no logo, banner or crest).
 */
export function createRooftopSignTexture(text: string, width = 1024, height = 168): CanvasTexture {
  return canvasTexture(width, height, (ctx) => {
    ctx.fillStyle = world.limestone;
    ctx.font = `bold ${Math.round(height * 0.78)}px Georgia, 'Times New Roman', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height * 0.52, width * 0.96);
    // Hairline strikes through the letters.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 2;
    for (const at of [0.34, 0.5, 0.66]) {
      ctx.beginPath();
      ctx.moveTo(0, height * at);
      ctx.lineTo(width, height * at);
      ctx.stroke();
    }
  });
}
