# The end of the shift

How the drive ends and starts again (Phase 7a and 7c): the roundabout at The Forks, then the reset to the first stop.

## What the visitor sees

1. The car reaches The Forks (the last stop). The Contact station can be opened and left as usual. The drive ends here: the road runs 38 m further, but the car cannot be driven past the stop.
2. With the car out of the station, the Next button at the last stop reads **New patrol ›** (it is the same button, so its place in the tab order and its focus do not change).
3. Pressing it starts the end of the shift. The caption **"New patrol starting."** appears in the dispatch radio region (screen readers read it there), and the car **loops the roundabout**: it drives the 38 m lead-in to the end of the road, goes once round the ring with the island on its left (Canada drives on the right and circulates counter-clockwise), and the camera follows behind it. The lap takes about ten seconds. Nothing else can drive the car meanwhile, and the Open button is not offered.
4. At the end of the lap the view fades to black (800 ms). While it is dark the car is put back at the first stop with a **cut**: the scene snaps its progress to the start, so it never drives back along the whole route. Any station state and pending station open are cleared.
5. The view fades back in (800 ms) at the first stop, and the drive controls say "Stop 1 of 11: Ignition".

Under **reduced motion** there is no lap and no veil at all: the reset runs at once and the view cuts. A lap the scene never finishes (a very slow machine) is ended after 70 s so the shift cannot hang.

Scrolling back mid-route does not reset; that is the Phase 8 U-turn.

## How it works

| Part        | Where                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State       | `shift` (`idle`, `looping`, `fading-out`, `fading-in`) and `resetCount` in `src/store/drive.ts`; `startNewPatrol` (only at the last stop, with the car out of its station), `finishLoop`, `completeFadeOut` (the cut) and `finishReset`. While `shift` is not idle every drive action and `openStation` are ignored. The drive ends at `LAST_STOP_T`              |
| The ring    | `src/scene/Road/roundabout.ts` (pure geometry: `roundaboutLayout`, `loopPath`, `ringStrips`, `ROUNDABOUT`) and `RoundaboutRoad.tsx` (the ring as road strips with the road's own surface, a snowy island and a low bank; three meshes). The road itself runs on 38 m past The Forks stop (two extra control points in `route.ts`) and meets the ring tangentially |
| The lap     | `RoundaboutDriver.tsx` moves the car along `loopPath` through the same car and camera override the station arrival uses (`stationView`), with a short ease at each end, and ends the lap; the car holds its last pose behind the veil                                                                                                                             |
| The fade    | `src/ui/Hud/ShiftFade.tsx`: a dark veil with no text and no pointer events; its timers (`SHIFT_FADE_MS`, `LOOP_MAX_MS` in `src/lib/shift.ts`) step the state, and under reduced motion skip the lap                                                                                                                                                               |
| The cut     | `ProgressDriver` snaps `progress.t` when `resetCount` changes                                                                                                                                                                                                                                                                                                     |
| The button  | `DriveControls`: Next becomes New patrol at the last stop (`drive.newPatrol` in `ui.ts`)                                                                                                                                                                                                                                                                          |
| The caption | The `new-patrol` line in `radio.ts` (stop `ignition`), shown by `Subtitles` whenever `shift` is not idle (`TODO(content)`: owner to tweak the wording)                                                                                                                                                                                                            |

## Tests

`roundabout.test.ts` (the island on the left, the car lane inside the ring, the lead-in meeting the ring, a steady turn, one lap back to the start, the ring strips), `drive.shift.test.ts` (the steps and their guards, and that nothing drives while it plays), `ShiftFade.test.tsx` (fake timers: the lap, the stuck-lap timeout, normal and reduced motion), the DriveControls and Subtitles tests, and `tests/e2e/shift.spec.ts` (drive to The Forks, leave, New patrol, the caption during the lap, back at stop 1; and the reduced-motion cut).
