# The U-turn

The car **never drives in reverse and never turns round by itself.** A U-turn is a deliberate move: the **Turn around** button, or a route-map jump to a stop that is nearer the other way (see [patrol-loop.md](patrol-loop.md) for the loop it happens on). The car swings across the road in a smooth U and carries on facing the other way in the other lane, with the camera behind it in the new direction. Canada drives on the right, so each direction has its own right-hand lane.

## What the visitor sees

- Press **Turn around** (it is on the second row of controls; after braking a hint points at it): about 1.8 seconds, a hairpin across the road that carries the car a few metres on in its old direction, ending in the **other lane facing back**. The chase camera follows it round gently (a lower follow rate while it turns) and settles behind the new direction. The car then stands still until driven on.
- Pressing it again while it turns does nothing; pressing it once the turn is over turns the car round again.
- A map jump to a stop turns the car round **at most once**, and only when that is shorter than driving on round the loop (a U-turn counts as `UTURN_COST` metres of driving when the two are compared). The car then drives on to the stop.
- It is not offered on a roundabout, in a station or while starting over. A station manoeuvre owns the car while it plays; a jump waits for it.
- Scrolling back, ArrowUp and Page Up only **brake**; they can never cause a U-turn.
- **Reduced motion:** no sweep. The car cuts to the other lane (a few metres on, facing back).

## How it works

| Part                     | Where                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The maths (pure, tested) | `src/lib/uturn.ts`: `uTurnPath` (the hairpin: a Bezier whose handles both reach ahead in the old direction, sharing `bezierPoint` with the parking path) and the constants `UTURN_SECONDS`, `UTURN_RUN`, `UTURN_HANDLE`                                |
| Where it lands           | `landing(s, run)` in `src/lib/loopRoute.ts`: the same road in the other lane, `run` metres on in the old direction (null on a roundabout); `planJump` picks driving on or turning round                                                                |
| The request              | `turnAround()` and `goToStop()` in `src/store/drive.ts` set `turnRequest` (and `goal`, where to drive after it); `finishTurn(pos)` clears it                                                                                                           |
| The decision             | `ProgressDriver.tsx` starts the turn (`travel.turn`) once the car is on the road and out of a bay                                                                                                                                                      |
| The turn                 | `UTurnDriver.tsx` moves the car along the path through the same car and camera override the station arrival uses (`stationView`), then moves `progress.s` to the other lane and calls `finishTurn`; under reduced motion it finishes in a single frame |
| The camera               | `CameraRig.tsx` follows more gently while `travel.turn` is set                                                                                                                                                                                         |

## Tests

`uturn.test.ts` (the path: exact start and end, leaving and arriving along the headings, a steady half turn the same way, a swing past the end, no sideways slide), `loopRoute.test.ts` (the landing, the plan: at most one U-turn), `drive.loop.test.ts` (Turn around turns the car round exactly once; jittery back-and-forth input causes zero turns), and `tests/e2e/uturn.spec.ts` (with `?probe=on`: the car ends facing back in the other lane after one smooth half turn over several frames and never moves against its heading; scrolling back only brakes; under reduced motion it cuts in a single step).
