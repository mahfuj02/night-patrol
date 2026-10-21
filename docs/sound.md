# Sound

Phase 9. Sound is **off by default** and never autoplays (CLAUDE.md rule 6).

- **The switch** (`src/ui/Sound/SoundToggle.tsx`): a button at the top, "Sound: off" / "Sound: on". The choice is remembered in `localStorage` (`night-patrol:sound`, always wrapped in try/catch, rule 11).
- **No autoplay, even from a saved "on".** A saved choice only restores the switch. Audio starts after the visitor's first click, tap or key press in the page (browsers require it anyway), or at once when they turn the switch on (`src/store/sound.ts`, `unlocked`).
- **What you hear** (`src/audio/engine.ts`, synthesised with the Web Audio API): an engine hum that idles and rises with the car's speed, tyres on snow (filtered noise, brighter with speed), a soft wiper swish matching the cabin wipers (not under reduced motion), and a short two-tone radio blip when the car arrives at a stop that has a radio line (every radio line is captioned too).
- **No audio files at all.** Everything is generated in the browser, so there is nothing to license, credit or download, and no CC0 audio to check (rule 8 is satisfied trivially). The audio code is a dynamic import, loaded only once sound is on, so it stays out of the first load.
- The speed mapping is pure (`src/audio/mapping.ts`) and tested; `SoundDriver` is headless and follows `progress.speed` every 100 ms.

Tests: `mapping.test.ts`, `Sound.test.tsx` (off by default and silent; the button turns it on, remembers it and turns it off; a saved "on" waits for a gesture; blocked storage).
