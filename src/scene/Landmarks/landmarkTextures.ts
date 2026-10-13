import { CanvasTexture, SRGBColorSpace } from 'three';
import { world } from '@/lib/palette';
import { sloganLines } from './signText';

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

/** Where each ghost sign sits in the atlas, as uv rectangles [u0, v0, u1, v1] (v up). */
export const ghostAtlasRects = {
  dryGoods: [0, 0.6, 1, 1],
  grain: [0, 0.2, 1, 0.6],
  warehouse: [0, 0, 1, 0.2],
} as const satisfies Record<string, [number, number, number, number]>;

/** A small deterministic random, so the fading is the same on every load. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Faded painted wall signs ("ghost signs") for the old warehouses, as one atlas: each sign is
 * pale paint with a ruled border, its words in heavy capitals, then worn away with speckles and
 * streaks so only part of it is left. The words come from `src/content` and are generic trades.
 */
export function createGhostSignTexture(
  words: { dryGoods: string; wholesale: string; warehouse: string; grain: string },
  width = 1024,
  height = 1024,
): CanvasTexture {
  return canvasTexture(width, height, (ctx) => {
    const random = seeded(77);
    const paint = '#E9DFC8';
    const sign = (
      rect: readonly [number, number, number, number],
      lines: string[],
      fontScale: number,
    ) => {
      const x = rect[0] * width;
      const w = (rect[2] - rect[0]) * width;
      const y = (1 - rect[3]) * height;
      const h = (rect[3] - rect[1]) * height;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.fillStyle = paint;
      ctx.strokeStyle = paint;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(x + h * 0.06, y + h * 0.06, w - h * 0.12, h - h * 0.12);
      const size = (h * fontScale) / lines.length;
      ctx.font = `900 ${Math.round(size)}px Impact, 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => {
        ctx.fillText(line, x + w / 2, y + h * ((i + 0.5) / lines.length), w * 0.86);
      });
      // Worn paint: blocks and streaks cut out of the sign.
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 160; i++) {
        ctx.globalAlpha = 0.25 + random() * 0.6;
        ctx.fillRect(x + random() * w, y + random() * h, 4 + random() * 26, 2 + random() * 8);
      }
      for (let i = 0; i < 14; i++) {
        ctx.globalAlpha = 0.5 + random() * 0.4;
        const sx = x + random() * w;
        ctx.fillRect(sx, y, 3 + random() * 10, h);
      }
      ctx.restore();
    };
    sign(ghostAtlasRects.dryGoods, [words.dryGoods, words.wholesale], 0.78);
    sign(
      ghostAtlasRects.grain,
      words.grain.split(' ').length > 2 ? splitGrain(words.grain) : [words.grain],
      0.8,
    );
    sign(ghostAtlasRects.warehouse, [words.warehouse], 0.7);
  });
}

/** Breaks a long sign over two lines at the middle word: "GRAIN EXCHANGE" over "SUPPLY". */
function splitGrain(text: string): string[] {
  const parts = text.split(' ');
  const last = parts.pop();
  return [parts.join(' '), last ?? ''];
}

/**
 * The marquee board: a dark panel with a ring of warm bulbs, the project name in big lit capitals
 * and a smaller line under it. Bright pixels (bulbs and letters) are what glow.
 */
export function createMarqueeTexture(
  title: string,
  /** The slogan, set over one or two lines. */
  subtitle: string,
  width = 1024,
  height = 304,
): CanvasTexture {
  return canvasTexture(width, height, (ctx) => {
    ctx.fillStyle = '#17110c';
    ctx.fillRect(0, 0, width, height);
    // The bulbs, all round the edge.
    const bulb = (x: number, y: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 11);
      gradient.addColorStop(0, '#FFF7D6');
      gradient.addColorStop(0.55, '#FFC873');
      gradient.addColorStop(1, 'rgba(255, 170, 70, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
    };
    const step = 44;
    for (let x = 28; x < width - 14; x += step) {
      bulb(x, 22);
      bulb(x, height - 22);
    }
    for (let y = 22 + step; y < height - 22; y += step) {
      bulb(28, y);
      bulb(width - 28, y);
    }
    // The words.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 170, 70, 0.8)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#FFE6A8';
    ctx.font = `900 ${Math.round(height * 0.38)}px 'Arial Black', Impact, sans-serif`;
    ctx.fillText(title, width / 2, height * 0.36, width * 0.86);
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFD08A';
    ctx.font = `600 ${Math.round(height * 0.12)}px 'Trebuchet MS', sans-serif`;
    const lines = sloganLines(subtitle);
    lines.forEach((line, i) => {
      const y = height * (lines.length === 1 ? 0.72 : 0.66 + i * 0.14);
      ctx.fillText(line, width / 2, y, width * 0.84);
    });
  });
}

/**
 * The request board over the City services door: the project name in lit capitals and the three
 * stages a request moves through, each with a status light. All wording comes from `src/content`.
 * Bright pixels (letters and lights) are what glow.
 */
export function createRequestBoardTexture(
  title: string,
  slogan: string,
  statuses: readonly [string, string, string],
  width = 1024,
  height = 340,
): CanvasTexture {
  return canvasTexture(width, height, (ctx) => {
    ctx.fillStyle = '#0d1a2b';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#4FE3E3';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(79, 227, 227, 0.7)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#C9F6F6';
    ctx.font = `900 ${Math.round(height * 0.3)}px 'Arial Black', Impact, sans-serif`;
    ctx.fillText(title, width / 2, height * 0.2, width * 0.86);
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#9FE8E8';
    ctx.font = `600 ${Math.round(height * 0.115)}px 'Trebuchet MS', sans-serif`;
    sloganLines(slogan).forEach((line, i) => {
      ctx.fillText(line, width / 2, height * (0.42 + i * 0.13), width * 0.86);
    });
    // The three stages, each with its light: amber, cyan, green.
    const lights = ['#FFB25C', '#4FE3E3', '#8DE59A'];
    const cell = (width - 80) / 3;
    statuses.forEach((status, i) => {
      const x = 40 + cell * i + cell / 2;
      const y = height * 0.72;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
      glow.addColorStop(0, '#FFFFFF');
      glow.addColorStop(0.4, lights[i]!);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E8EEF5';
      ctx.font = `600 ${Math.round(height * 0.11)}px 'Trebuchet MS', sans-serif`;
      ctx.fillText(status, x, height * 0.9, cell - 24);
    });
  });
}
