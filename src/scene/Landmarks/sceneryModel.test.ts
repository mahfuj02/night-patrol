import { describe, expect, it } from 'vitest';
import {
  ESPLANADE,
  MUSEUM,
  WARM_HOUSE,
  bridgeCableGeometry,
  bridgeSteelGeometry,
  houseBodyGeometry,
  houseDetailGeometry,
  houseRoofGeometry,
  museumBaseGeometry,
  museumTowerGeometry,
  museumTowerTop,
  spireTop,
} from './sceneryModel';
import { esplanadePlacement, museumPlacement, warmHousePlacement } from './placement';

const box = (g: ReturnType<typeof houseBodyGeometry>) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};
const within = (g: ReturnType<typeof houseBodyGeometry>, placement: typeof warmHousePlacement) => {
  const b = box(g);
  expect(b.min.x).toBeGreaterThanOrEqual(placement.reserved.min);
  expect(b.max.x).toBeLessThanOrEqual(placement.reserved.max);
  expect(b.min.z).toBeGreaterThanOrEqual(-placement.depth / 2 - 4.5);
  expect(b.max.z).toBeLessThanOrEqual(placement.depth / 2 + 1);
};

describe('warm house model', () => {
  it('is a two-storey body under a gabled roof, with a porch in front', () => {
    const body = box(houseBodyGeometry());
    expect(body.max.y).toBeCloseTo(WARM_HOUSE.storey * WARM_HOUSE.floors, 5);
    const roof = box(houseRoofGeometry());
    expect(roof.min.y).toBeCloseTo(body.max.y, 5);
    expect(roof.max.y).toBeCloseTo(body.max.y + WARM_HOUSE.roofRise, 5);
    const porch = box(houseDetailGeometry());
    expect(porch.min.z).toBeLessThan(body.min.z);
  });

  it('stays inside its reserved ground', () => {
    for (const g of [houseBodyGeometry(), houseRoofGeometry(), houseDetailGeometry()]) {
      within(g, warmHousePlacement);
    }
  });

  it('gives the body metre uvs for the window shader', () => {
    const g = houseBodyGeometry();
    expect(g.getAttribute('uv').count).toBe(g.getAttribute('position').count);
  });
});

describe('museum model', () => {
  it('stands a tall tapering glass tower on a stone base', () => {
    const base = box(museumBaseGeometry());
    const tower = box(museumTowerGeometry());
    expect(tower.min.y).toBeCloseTo(MUSEUM.base.height, 5);
    expect(tower.max.y).toBeCloseTo(museumTowerTop, 5);
    expect(museumTowerTop).toBeGreaterThan(MUSEUM.base.height * 3);
    // Narrower at the top than at the bottom.
    expect(MUSEUM.tower.top).toBeLessThan(MUSEUM.tower.bottom);
    expect(tower.max.x - tower.min.x).toBeCloseTo(2 * MUSEUM.tower.bottom, 1);
    expect(base.max.y).toBeCloseTo(MUSEUM.base.height + 0.4, 5);
  });

  it('stays inside its reserved ground', () => {
    within(museumBaseGeometry(), museumPlacement);
    within(museumTowerGeometry(), museumPlacement);
  });
});

describe('Esplanade Riel model', () => {
  it('has a deck on piers and a spire rising well above it', () => {
    const steel = box(bridgeSteelGeometry());
    expect(steel.min.y).toBeCloseTo(0, 6);
    expect(steel.max.y).toBeCloseTo(spireTop, 5);
    expect(spireTop).toBeGreaterThan(ESPLANADE.deck.y + 30);
    within(bridgeSteelGeometry(), esplanadePlacement);
  });

  it('fans cable stays from the spire down to the deck, on both sides', () => {
    const cables = bridgeCableGeometry();
    const position = cables.getAttribute('position');
    expect(position.count).toBe(ESPLANADE.cableHeights.length * 4);
    const deckTop = ESPLANADE.deck.y + ESPLANADE.deck.height;
    for (let i = 0; i < position.count; i += 2) {
      // One end on the spire axis, the other on the deck.
      expect(position.getX(i)).toBe(0);
      expect(position.getY(i)).toBeGreaterThan(deckTop);
      expect(position.getY(i + 1)).toBeCloseTo(deckTop, 6);
      expect(Math.abs(position.getX(i + 1))).toBeLessThanOrEqual(ESPLANADE.deck.width / 2);
    }
    const sides = new Set<number>();
    for (let i = 1; i < position.count; i += 2) sides.add(Math.sign(position.getX(i)));
    expect([...sides].sort()).toEqual([-1, 1]);
  });
});
