import { engineFrequency, engineGain, tyreCutoff, tyreGain } from './mapping';

/**
 * The car's sound, synthesised with the Web Audio API: an engine hum (two detuned oscillators through
 * a low-pass filter), tyres on snow (filtered noise), a soft wiper swish and a short radio blip. No
 * files, so nothing to license. It is created only after the visitor has turned sound on, and
 * `dispose` closes it again.
 */
export interface SoundEngine {
  /** Sets the car's speed in metres per second (smoothly). */
  setSpeed: (speed: number) => void;
  /** A short two-tone radio blip, as a dispatch line comes in. */
  blip: () => void;
  /** One soft swish of the wipers. */
  wipe: () => void;
  dispose: () => void;
}

const SMOOTH = 0.15;

function noiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // A small deterministic generator: the same hiss every time, nothing random to test around.
  let seed = 1234567;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    data[i] = seed / 2147483648 - 1;
  }
  return buffer;
}

export function createEngine(ctx: AudioContext): SoundEngine {
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);

  // The engine hum.
  const hum = ctx.createGain();
  const humFilter = ctx.createBiquadFilter();
  humFilter.type = 'lowpass';
  humFilter.frequency.value = 260;
  const oscillators = [0, 1].map((i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? 'sawtooth' : 'triangle';
    osc.detune.value = i === 0 ? 0 : 7;
    osc.connect(humFilter);
    osc.start();
    return osc;
  });
  humFilter.connect(hum);
  hum.connect(master);

  // Tyres on snow: looped noise through a low-pass.
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.loop = true;
  const tyreFilter = ctx.createBiquadFilter();
  tyreFilter.type = 'lowpass';
  const tyres = ctx.createGain();
  noise.connect(tyreFilter);
  tyreFilter.connect(tyres);
  tyres.connect(master);
  noise.start();

  const setSpeed = (speed: number) => {
    const now = ctx.currentTime;
    for (const osc of oscillators)
      osc.frequency.setTargetAtTime(engineFrequency(speed), now, SMOOTH);
    hum.gain.setTargetAtTime(engineGain(speed), now, SMOOTH);
    tyres.gain.setTargetAtTime(tyreGain(speed), now, SMOOTH);
    tyreFilter.frequency.setTargetAtTime(tyreCutoff(speed), now, SMOOTH);
  };
  setSpeed(0);

  const tone = (frequency: number, start: number, length: number, level: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.01);
    gain.gain.linearRampToValueAtTime(0, start + length);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + length + 0.02);
  };

  return {
    setSpeed,
    blip: () => {
      const now = ctx.currentTime;
      tone(880, now, 0.07, 0.05);
      tone(1320, now + 0.09, 0.07, 0.05);
    },
    wipe: () => {
      const now = ctx.currentTime;
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer(ctx, 1);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 0.25);
      gain.gain.linearRampToValueAtTime(0, now + 0.6);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(now);
      source.stop(now + 0.7);
    },
    dispose: () => {
      for (const osc of oscillators) osc.stop();
      noise.stop();
      master.disconnect();
      void ctx.close();
    },
  };
}
