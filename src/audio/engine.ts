import { engineFrequency, engineGain, tyreCutoff, tyreGain } from './mapping';

/**
 * The car's sound, synthesised with the Web Audio API and kept soft on purpose: a warm low hum (two
 * sine tones, an octave apart, through a low-pass), a gentle bed of distant wind, tyres hushing on snow
 * (very quiet, low-passed noise), a soft wiper brush and a gentle two-note chime for the radio. No
 * harsh waveforms, no files, so nothing to license. It is created only after the visitor has turned
 * sound on, and `dispose` closes it again.
 */
export interface SoundEngine {
  /** Sets the car's speed in metres per second (very smoothly). */
  setSpeed: (speed: number) => void;
  /** A soft two-note chime, as a dispatch line comes in. */
  blip: () => void;
  /** One soft brush of the wipers. */
  wipe: () => void;
  dispose: () => void;
}

/** Time constant of every change, in seconds: slow, so nothing ever steps or sweeps. */
const SMOOTH = 0.6;

/** Brown-ish noise (each sample leans on the last), which sounds like wind rather than hiss. */
function softNoise(ctx: AudioContext, seconds = 4): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // A small deterministic generator: the same noise every time, nothing random to test around.
  let seed = 1234567;
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const white = seed / 2147483648 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

export function createEngine(ctx: AudioContext): SoundEngine {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  // Fade in over a couple of seconds, so turning sound on never starts with a click.
  master.gain.setTargetAtTime(0.7, ctx.currentTime, 0.8);

  // The warm hum: a sine and its octave.
  const hum = ctx.createGain();
  const humFilter = ctx.createBiquadFilter();
  humFilter.type = 'lowpass';
  humFilter.frequency.value = 200;
  const oscillators = [1, 2].map((multiple) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const level = ctx.createGain();
    level.gain.value = multiple === 1 ? 1 : 0.25;
    osc.connect(level);
    level.connect(humFilter);
    osc.start();
    return { osc, multiple };
  });
  humFilter.connect(hum);
  hum.connect(master);

  // A soft bed of distant wind, always there, very quiet.
  const wind = ctx.createBufferSource();
  wind.buffer = softNoise(ctx);
  wind.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 320;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.05;
  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(master);
  wind.start();

  // Tyres hushing on snow: the same soft noise, low-passed, rising a little with speed.
  const hush = ctx.createBufferSource();
  hush.buffer = softNoise(ctx, 3);
  hush.loop = true;
  const tyreFilter = ctx.createBiquadFilter();
  tyreFilter.type = 'lowpass';
  const tyres = ctx.createGain();
  hush.connect(tyreFilter);
  tyreFilter.connect(tyres);
  tyres.connect(master);
  hush.start();

  const setSpeed = (speed: number) => {
    const now = ctx.currentTime;
    for (const { osc, multiple } of oscillators) {
      osc.frequency.setTargetAtTime(engineFrequency(speed) * multiple, now, SMOOTH);
    }
    hum.gain.setTargetAtTime(engineGain(speed), now, SMOOTH);
    tyres.gain.setTargetAtTime(tyreGain(speed), now, SMOOTH);
    tyreFilter.frequency.setTargetAtTime(tyreCutoff(speed), now, SMOOTH);
  };
  setSpeed(0);

  /** One soft note: a sine with a slow attack and a long fade. */
  const note = (frequency: number, start: number, length: number, level: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + length + 0.05);
  };

  return {
    setSpeed,
    blip: () => {
      const now = ctx.currentTime;
      note(523.25, now, 0.7, 0.03);
      note(659.25, now + 0.16, 0.9, 0.03);
    },
    wipe: () => {
      const now = ctx.currentTime;
      const source = ctx.createBufferSource();
      source.buffer = softNoise(ctx, 1);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.3);
      gain.gain.linearRampToValueAtTime(0, now + 0.8);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(now);
      source.stop(now + 0.9);
    },
    dispose: () => {
      for (const { osc } of oscillators) osc.stop();
      wind.stop();
      hush.stop();
      master.disconnect();
      void ctx.close();
    },
  };
}
