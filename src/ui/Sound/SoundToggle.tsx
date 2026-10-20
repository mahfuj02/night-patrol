'use client';

import { useEffect } from 'react';
import { simpleCopy } from '@/content/ui';
import { useSoundStore } from '@/store/sound';

const copy = simpleCopy.sound;

/**
 * The sound switch. Sound is off by default and never starts by itself; this button turns it on (and
 * off), and the choice is remembered. It is a real toggle button (`aria-pressed`) with a text label.
 */
export function SoundToggle() {
  const enabled = useSoundStore((s) => s.enabled);
  const toggle = useSoundStore((s) => s.toggle);
  const hydrate = useSoundStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="bg-night-2 text-hud border-hud/40 fixed top-3 right-[9.5rem] z-10 rounded-md border px-3 py-2 text-sm font-medium"
    >
      {enabled ? copy.on : copy.off}
    </button>
  );
}
