# The car

Phase 10. The owner's white sedan, modelled from primitives (`src/scene/Car/carModel.ts`, drawn by `Car.tsx`): a long low shell with a sloped hood and boot, a tinted-glass cabin under a white roof, an amber roof light bar (emissive), bumpers and a plain grille, mirrors, four tyres with black rims, headlights and taillights, a faint cyan underglow (an additive quad), and a licence plate front and back. About 30 meshes, no textures except the plate.

- **No manufacturer marks** (CLAUDE.md rule 10): no badges, logos or brand shapes; `carModel.test.ts` checks no part is named for one.
- **The plate** reads `profile.plate` ("MAHFUJ02", the owner's public GitHub username) from `src/content/profile.ts`, on a stylised plate drawn into a small canvas texture (`plateTexture.ts`) that is not a copy of any real plate.
- **Colours** come from the `world` palette (`car-shell`, `car-glass`, `car-trim`, `car-rim`, `light-bar`, `underglow`, `plate-bg`, `plate-ink`, listed in `docs/art-reference.md`). Materials and the plate texture are created once and disposed on unmount.
- **Landmarks and buildings** stay procedural: the project's rule 8 is original geometry only, so the hand-modelled pass for the landmarks is the existing procedural models (`src/scene/Landmarks/*Model.ts`) rather than imported meshes, and there is no model file to optimise (`pnpm models:optimize` has nothing to process).
