# The U-turn

When the car has to go back the way it came (Prev, a map jump to an earlier stop, scrolling back), it **never drives in reverse**. It swings across the road in a smooth U and carries on facing forward in the other lane, with the camera behind it in the new direction (Phase 8a). Canada drives on the right, so each direction has its own right-hand lane.

## What the visitor sees

- Going forward, the car is in the route's right-hand lane and faces along the route (as always).
- Ask for something behind it (more than about 5 m back) and, instead of rolling backward, the car **turns round**: about 1.8 seconds, a hairpin across the road that carries it a few metres on in its old direction, ending in the **other lane facing back**. The chase camera follows it round gently (a lower follow rate while it turns) and settles behind the new direction. Then it drives back toward the stop.
- Ask for something ahead again and it turns round again the same way.
- A small step back (a stop's magnet settling, a nudge of the wheel) does not turn the car: it just holds still. The car never moves against the way it faces.
- **Reduced motion:** no U-turn. The car cuts to the other lane (at the same spot, facing back), and moves between stops as it does for every other cut.
- The U-turn waits for a station manoeuvre or the end-of-shift lap to finish; those own the car while they play. The end-of-shift reset puts the car back facing forward.

## How it works

| Part                     | Where                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The maths (pure, tested) | `src/lib/uturn.ts`: `needsTurn` (the request is behind the car by more than `TURN_TRIGGER_METRES`), `followDirection` (never move against the direction), `uTurnEnd` (where it comes out), `uTurnPath` (the hairpin: a Bezier whose handles both reach ahead in the old direction, sharing `bezierPoint` with the parking path), and the constants `UTURN_SECONDS`, `UTURN_RUN`, `UTURN_HANDLE` |
| The lanes                | `routeModel.lanePointAt(u, out, direction)` in `src/scene/Road/route.ts`: the right-hand lane for the direction (for -1 it is the route's left lane)                                                                                                                                                                                                                                            |
| The state                | `src/scene/travel.ts`: `travel.direction` (1 or -1), the U-turn in progress, and `carPoseAt(t, direction)`, which the car, the camera, the station arrival and the test probe all use                                                                                                                                                                                                           |
| The decision             | `ProgressDriver.tsx` holds the car still instead of reversing, starts a U-turn when `needsTurn`, and flips the direction at once under reduced motion                                                                                                                                                                                                                                           |
| The turn                 | `UTurnDriver.tsx` moves the car along the path through the same car and camera override the station arrival uses (`stationView`), then flips `travel.direction` and puts progress where the car came out                                                                                                                                                                                        |
| The camera               | `CameraRig.tsx` chases the car in `travel.direction`, and follows more gently while `travel.turn` is set                                                                                                                                                                                                                                                                                        |

The station arrival, the car and the camera all go through `carPoseAt`, so a station chosen while the car is heading back parks it from the lane it is in.

## Tests

`uturn.test.ts` (the trigger, never reversing, where it comes out, the path: exact start and end, leaving and arriving along the headings, a steady half turn the same way, a swing past the end, no sideways slide), `travel.test.ts` (the lane for each direction, the pose facing the way it goes, on the right of its own direction), and `tests/e2e/uturn.spec.ts` (with `?probe=on`: Next then Prev: the car ends at the first stop facing back and across the road from where it started, turns through the half turn over several frames, never moves against its heading; and under reduced motion it cuts in a single step).
