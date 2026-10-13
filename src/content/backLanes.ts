import type { BackLanes } from './schema';

/**
 * The back lanes behind the houses of the residential stretch (the `house` building stretches):
 * wooden power poles with wires, fences along the back and side of the lots, and city bins. All
 * distances are in metres. `poleOffset` is how far behind the front of the house row the pole line
 * runs, so the poles stand behind the garages and show between and above the houses.
 * TODO(content): owner to tune spacing and density by eye.
 */
export const backLanes: BackLanes = {
  poleSpacing: 30,
  poleOffset: 24,
  poleHeight: 11,
  fenceHeight: 1.5,
  fenceChance: 0.9,
  binChance: 0.75,
};
