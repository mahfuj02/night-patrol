# Scenery

Lit buildings beside the route that are **not stops**: no checkpoint, no panel, no radio line, and (for the museum and the bridge) no lettering. They make the avenue and the residential street feel like places. Three pieces:

| Piece                                | Where                                                            | What it is                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| The warm-windowed house              | Residential street, just past the dashcam stop, on the left      | A two-storey house with cream siding, a snowy gable roof, a small porch, and almost every window lit warm. No figures, no text |
| The Canadian Museum for Human Rights | The avenue, about 112 m before the end of the route, on the left | A wide stone base and a tall, tapering glass tower that glows from inside. A lit silhouette: no lettering, no logo             |
| Esplanade Riel                       | The avenue, about 52 m before the end of the route, on the left  | A footbridge deck on two piers with a tall glowing spire and cable stays fanning down to the deck                              |

CLAUDE.md rules 9 and 10 apply: the house is warm windows only (no people, no sad music, no text), and the museum and the bridge are plain silhouettes with no logos or brand marks.

## How it works

- Placement is in `src/scene/Landmarks/placement.ts` (`sceneryPlacements`), measured from a stop that exists (the dashcam or The Forks) by an offset in metres, on a side, with a depth, a setback and a reserved stretch, exactly like a landmark. It is kept apart from `landmarkPlacements` because it belongs to no stop (a station's lookup by stop is not confused by it). `sceneryFrame` gives the frame; its `stopT` is the route position of the piece itself.
- Ordinary buildings leave its ground free (`sceneBuildings.ts` reserves both the landmarks and the scenery).
- It uses the same `Landmark` base as a stop, with two options: `minGlow` (scenery is always lit a little, then brightens as the car passes; a cut under reduced motion) and `lean={false}` (the camera never leans toward scenery, only toward stops).
- Geometry is in `sceneryModel.ts` (stylized, in local metres, front facing -z); materials in `sceneryMaterials.ts` (the shared window-grid shader for the house and the museum base, emissive glass and steel for the tower and the bridge, pale lines for the cables); the components are in `Scenery.tsx`.

## Cost

Seven meshes: three for the house (body, roof, porch), two for the museum, two for the bridge (steel, cables). About seven draw calls and a few hundred triangles; no textures. They are frustum-culled, so most of the time only the piece the car is near is drawn.

## Tests

`sceneryModel.test.ts` (shapes, reserved ground, cables), and `placement.test.ts` (each piece is on the left, clear of the road and the cross streets, apart from the landmarks and each other, and lit from its own position).
