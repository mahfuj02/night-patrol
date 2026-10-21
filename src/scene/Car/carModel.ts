import type { WorldToken } from '@/lib/palette';

/**
 * The car as plain data: a white sedan with tinted windows, an amber roof light bar, black rims and
 * no manufacturer marks (CLAUDE.md rule 10). Local +z is forward, +x is the car's left, y is up, in
 * metres, with the origin on the ground at the middle of the car. Kept pure so the shape is tested
 * without a renderer; `Car.tsx` draws each part as one mesh.
 */
export type CarMaterial = 'shell' | 'glass' | 'trim' | 'rim' | 'bar';

export interface CarPart {
  id: string;
  kind: 'box' | 'wheel';
  size: [number, number, number];
  position: [number, number, number];
  /** Rotation about x, in radians (a gentle slope for the hood and the glass). */
  tilt?: number;
  material: CarMaterial;
}

/** The world palette token behind each material. */
export const CAR_COLOURS: Record<CarMaterial, WorldToken> = {
  shell: 'carShell',
  glass: 'carGlass',
  trim: 'carTrim',
  rim: 'carRim',
  bar: 'lightBar',
};

export const CAR_LENGTH = 4.6;
export const CAR_WIDTH = 1.82;
export const WHEEL_RADIUS = 0.34;

const half = CAR_WIDTH / 2;

const mirrored = (id: string, part: Omit<CarPart, 'id'>): CarPart[] =>
  [-1, 1].map((side) => ({
    ...part,
    id: `${id}-${side < 0 ? 'right' : 'left'}`,
    position: [side * part.position[0], part.position[1], part.position[2]],
  }));

export const carParts: CarPart[] = [
  // The body: a long low shell, with a lower hood and boot either side of the cabin.
  {
    id: 'body',
    kind: 'box',
    size: [CAR_WIDTH, 0.5, CAR_LENGTH],
    position: [0, 0.6, 0],
    material: 'shell',
  },
  {
    id: 'hood',
    kind: 'box',
    size: [1.74, 0.14, 1.4],
    position: [0, 0.9, 1.45],
    tilt: -0.07,
    material: 'shell',
  },
  {
    id: 'boot',
    kind: 'box',
    size: [1.74, 0.14, 1.0],
    position: [0, 0.91, -1.75],
    tilt: 0.04,
    material: 'shell',
  },
  // The cabin: tinted glass under a white roof.
  {
    id: 'greenhouse',
    kind: 'box',
    size: [1.62, 0.5, 2.1],
    position: [0, 1.17, -0.1],
    material: 'glass',
  },
  {
    id: 'roof',
    kind: 'box',
    size: [1.5, 0.07, 1.55],
    position: [0, 1.46, -0.1],
    material: 'shell',
  },
  {
    id: 'windshield-pillar',
    kind: 'box',
    size: [1.6, 0.05, 0.25],
    position: [0, 1.32, 0.95],
    tilt: -0.7,
    material: 'shell',
  },
  // The amber light bar along the roof.
  {
    id: 'light-bar',
    kind: 'box',
    size: [0.95, 0.08, 0.24],
    position: [0, 1.54, -0.1],
    material: 'bar',
  },
  // Bumpers and a plain grille.
  {
    id: 'bumper-front',
    kind: 'box',
    size: [CAR_WIDTH - 0.02, 0.2, 0.14],
    position: [0, 0.48, CAR_LENGTH / 2],
    material: 'trim',
  },
  {
    id: 'bumper-rear',
    kind: 'box',
    size: [CAR_WIDTH - 0.02, 0.2, 0.14],
    position: [0, 0.48, -CAR_LENGTH / 2],
    material: 'trim',
  },
  {
    id: 'grille',
    kind: 'box',
    size: [1.0, 0.12, 0.05],
    position: [0, 0.72, CAR_LENGTH / 2 + 0.01],
    material: 'trim',
  },
  // Mirrors.
  ...mirrored('mirror', {
    kind: 'box',
    size: [0.14, 0.1, 0.18],
    position: [half + 0.08, 1.12, 0.78],
    material: 'shell',
  }),
  // Four wheels, each a tyre with a black rim.
  ...[-1, 1].flatMap((side) =>
    [-1, 1].flatMap((end) => {
      const x = side * (half - 0.02);
      const z = end * 1.4;
      const name = `${side < 0 ? 'right' : 'left'}-${end < 0 ? 'rear' : 'front'}`;
      return [
        {
          id: `tyre-${name}`,
          kind: 'wheel' as const,
          size: [WHEEL_RADIUS, WHEEL_RADIUS, 0.24] as [number, number, number],
          position: [x, WHEEL_RADIUS, z] as [number, number, number],
          material: 'trim' as const,
        },
        {
          id: `rim-${name}`,
          kind: 'wheel' as const,
          size: [0.21, 0.21, 0.26] as [number, number, number],
          position: [x, WHEEL_RADIUS, z] as [number, number, number],
          material: 'rim' as const,
        },
      ];
    }),
  ),
];

/** Where the licence plates hang, front and back, and how big they are. */
export const PLATE = {
  width: 0.52,
  height: 0.12,
  front: [0, 0.4, CAR_LENGTH / 2 + 0.085] as [number, number, number],
  rear: [0, 0.62, -CAR_LENGTH / 2 - 0.085] as [number, number, number],
};

/** The faint cyan underglow: a flat quad a little smaller than the car, just above the road. */
export const UNDERGLOW = {
  width: CAR_WIDTH - 0.1,
  length: CAR_LENGTH - 0.5,
  y: 0.1,
  opacity: 0.55,
};
