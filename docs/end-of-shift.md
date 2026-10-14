# The end of the shift

How the drive ends and starts again (Phase 7a). The roundabout loop at The Forks is planned but not built yet; this is the reset that follows it.

## What the visitor sees

1. The car reaches The Forks (the last stop) and the Contact station can be opened and left as usual.
2. With the car out of the station, the Next button at the last stop reads **New patrol ›** (it is the same button, so its place in the tab order and its focus do not change).
3. Pressing it fades the view to black (800 ms) and shows the caption **"New patrol starting."** in the dispatch radio region (screen readers read it there).
4. While it is dark the car is put back at the first stop with a **cut**: the scene snaps its progress to the start, so it never drives back along the whole route. Any station state and pending station open are cleared.
5. The view fades back in (800 ms) at the first stop, and the drive controls say "Stop 1 of 11: Ignition".

Under **reduced motion** there is no veil at all: the reset runs at once and the view cuts.

Scrolling back mid-route does not reset; that is the Phase 8 U-turn.

## How it works

| Part        | Where                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State       | `shift` (`idle`, `fading-out`, `fading-in`) and `resetCount` in `src/store/drive.ts`; `startNewPatrol` (only at the last stop, with the car out of its station), `completeFadeOut` (the cut) and `finishReset` |
| The fade    | `src/ui/Hud/ShiftFade.tsx`: a dark veil with no text and no pointer events; its timers (`SHIFT_FADE_MS` in `src/lib/shift.ts`) step the state                                                                  |
| The cut     | `ProgressDriver` snaps `progress.t` when `resetCount` changes                                                                                                                                                  |
| The button  | `DriveControls`: Next becomes New patrol at the last stop (`drive.newPatrol` in `ui.ts`)                                                                                                                       |
| The caption | The `new-patrol` line in `radio.ts` (stop `ignition`), shown by `Subtitles` whenever `shift` is not idle (`TODO(content)`: owner to tweak the wording)                                                         |

## Tests

`drive.shift.test.ts` (the state steps and their guards), `ShiftFade.test.tsx` (fake timers, normal and reduced motion), the DriveControls and Subtitles tests, and `tests/e2e/shift.spec.ts` (drive to The Forks, leave, New patrol, back at stop 1; and the reduced-motion cut).
