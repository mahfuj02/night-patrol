# How the drive works

```
wheel / touch / keys ─► useDriveInput ─► drive store (target t)
                                              │
              ProgressDriver (each frame): magnet + easing ─► progress.t
                                              │
                          Car and CameraRig read progress.t, sample the curve
```

- `src/lib/route.ts`: pure math (magnet, easing, stepping, input conversion). No three.js, fully unit-tested.
- `src/store/drive.ts`: the requested position `target`, the nearest `stopIndex`, and `atStop`.
- `src/hooks/useDriveInput.ts`: input. Wheel and touch listeners sit on the scene container only. The key handler ignores modified keys and anything inside a focused control, and never calls `preventDefault`, so Tab, Enter, Space on buttons and screen reader keys behave normally.
- `src/scene/`: the only place three.js is imported. `Road/route.ts` builds the curve from `src/content/route.ts`.
- `src/ui/DriveControls`: DOM controls and the live stop announcement.

## Keys

| Key                            | Action                                            |
| ------------------------------ | ------------------------------------------------- |
| Arrow keys                     | Drive a little (steps one stop in reduced motion) |
| Page Down / Space              | Next stop                                         |
| Page Up / Shift + Space        | Previous stop                                     |
| Wheel, trackpad, swipe up/down | Drive (one stop per gesture in reduced motion)    |

## Reduced motion

With `prefers-reduced-motion: reduce` there is no easing and no continuous camera motion: each input moves one stop and the view cuts to it.

## Budgets (measured on the current scene)

See the PR description for the latest numbers. In development, an overlay shows fps, draw calls and triangles. Production builds do not include it.

## No WebGL

`/` shows a message and a link to `/simple`. Controls and the canvas are not rendered.
