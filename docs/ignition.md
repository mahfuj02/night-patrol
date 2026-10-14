# The Ignition loading screen

The first thing a visitor sees (Phase 7b). A dark dashboard with a fuel gauge that fills as the 3D scene loads, then a **Start Patrol** button. It is the "Ignition" stop of the drive.

## What the visitor sees

1. A full-screen dark dashboard titled **Ignition** with a semicircular fuel gauge, E to F, a needle and the text "Starting the engine… 42%". The gauge is a labelled progress bar (`role="progressbar"`, "Fuel: engine start-up progress"); the percentage is also real text, announced politely.
2. A **Skip to simple view** link is there from the first moment.
3. When the scene has drawn a few frames and its assets are in, the text changes to "Engine ready." and **Start Patrol** appears, with focus on it.
4. **Start Patrol** fades the screen away (0.7 s; a cut under reduced motion), pulls the car out to the first stop (Dispatch), and hands focus to the Next stop button.

While the screen is up, the page behind it is `inert`, and wheel, touch and keys do not drive the car. If the scene is slow or stuck, Start Patrol is offered after 25 s anyway, so nobody is trapped. Without WebGL the screen never shows (the simple-version fallback is shown instead).

`?intro=off` skips the screen (for the end-to-end tests and for linking straight into the drive); it does not move the car.

## How it works

| Part         | Where                                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Progress     | `src/scene/LoadReporter.tsx` reads Drei's `useProgress` and the first frames and writes them to `src/store/intro.ts`, so the UI never imports three.js. It runs inside the canvas |
| State        | `src/store/intro.ts`: `loading`, `ready`, `started`; ready needs the loader to have reported, nothing left to load, and a few frames drawn                                        |
| Pure helpers | `src/lib/intro.ts`: `parseIntroParam`, `gaugePercent` (rounds, clamps, never goes backwards), `needleAngle`, `INTRO_PATIENCE_MS`                                                  |
| The screen   | `src/ui/Ignition/LoadingScreen.tsx`; wired in `HomeExperience`, which makes the rest of the page inert and turns off drive input while it is up (`useDriveInput`'s `enabled`)     |
| Copy         | `intro` in `ui.ts` (label, gauge, loading, ready, start, skip)                                                                                                                    |

## Tests

`intro.test.ts` (helpers), `store/intro.test.ts`, `LoadingScreen.test.tsx` (gauge, ready, focus, mouse and keyboard start, patience timeout, `?intro=off`), `HomeExperience.test.tsx` (inert page and no keyboard driving), and `tests/e2e/ignition.spec.ts` (with axe, the start, the skip link, `?intro=off`, reduced motion). Every other end-to-end spec opens the drive with `&intro=off`.
