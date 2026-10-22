import { describe, expect, it } from 'vitest';
import { profile } from '@/content/profile';
import { world } from '@/lib/palette';
import {
  CAR_COLOURS,
  CAR_LENGTH,
  CAR_WIDTH,
  PLATE,
  UNDERGLOW,
  WHEEL_RADIUS,
  carParts,
} from './carModel';

describe('the car model', () => {
  it('has unique parts with positive sizes', () => {
    const ids = carParts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const part of carParts) {
      for (const n of part.size) expect(n, part.id).toBeGreaterThan(0);
    }
  });

  it('is a sedan about the size of a compact car, and low enough to see over', () => {
    expect(CAR_LENGTH).toBeGreaterThan(4.3);
    expect(CAR_LENGTH).toBeLessThan(4.9);
    expect(CAR_WIDTH).toBeGreaterThan(1.7);
    expect(CAR_WIDTH).toBeLessThan(2.0);
    const top = Math.max(
      ...carParts.filter((p) => p.kind === 'box').map((p) => p.position[1] + p.size[1] / 2),
    );
    expect(top).toBeLessThan(1.7);
  });

  it('has four wheels at the corners, each with a black rim, sitting on the road', () => {
    const tyres = carParts.filter((p) => p.id.startsWith('tyre-'));
    const rims = carParts.filter((p) => p.id.startsWith('rim-'));
    expect(tyres).toHaveLength(4);
    expect(rims).toHaveLength(4);
    for (const tyre of tyres) {
      expect(tyre.position[1]).toBeCloseTo(WHEEL_RADIUS, 9);
      expect(Math.abs(tyre.position[0])).toBeLessThan(CAR_WIDTH / 2);
    }
    expect(new Set(tyres.map((t) => Math.sign(t.position[0]))).size).toBe(2);
    expect(new Set(tyres.map((t) => Math.sign(t.position[2]))).size).toBe(2);
    expect(rims.every((r) => r.material === 'rim')).toBe(true);
  });

  it('is left-right symmetric', () => {
    for (const part of carParts) {
      if (part.position[0] === 0) continue;
      const twin = carParts.find(
        (p) =>
          p !== part &&
          p.position[0] === -part.position[0] &&
          p.position[1] === part.position[1] &&
          p.position[2] === part.position[2],
      );
      expect(twin, part.id).toBeDefined();
    }
  });

  it('has the amber light bar on the roof and tinted glass', () => {
    const bar = carParts.find((p) => p.material === 'bar')!;
    const roof = carParts.find((p) => p.id === 'roof')!;
    expect(bar.position[1]).toBeGreaterThan(roof.position[1]);
    expect(carParts.some((p) => p.material === 'glass')).toBe(true);
  });

  it('draws every material from the world palette', () => {
    for (const token of Object.values(CAR_COLOURS)) expect(world[token]).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('has no manufacturer marks: nothing is named for a badge, logo or brand', () => {
    for (const part of carParts) expect(part.id).not.toMatch(/badge|logo|emblem|brand|honda/i);
  });

  it('hangs the plates at both ends, text from content', () => {
    expect(PLATE.front[2]).toBeGreaterThan(CAR_LENGTH / 2);
    expect(PLATE.rear[2]).toBeLessThan(-CAR_LENGTH / 2);
    expect(profile.plate).toBe('MAHFUJ02');
  });

  it('keeps the underglow inside the footprint of the car', () => {
    expect(UNDERGLOW.width).toBeLessThan(CAR_WIDTH);
    expect(UNDERGLOW.length).toBeLessThan(CAR_LENGTH);
    expect(UNDERGLOW.opacity).toBeLessThan(0.8);
  });
});
