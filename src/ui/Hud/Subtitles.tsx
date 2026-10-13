'use client';

import { radioLines } from '@/content/radio';
import { stops } from '@/content/stops';
import { simpleCopy } from '@/content/ui';
import { useDriveStore } from '@/store/drive';

/**
 * The dispatch radio as captions: the stop's radio line, shown as text while the car is at the
 * stop. Every radio line is captioned (CLAUDE.md rule 6); there is no audio. The region is polite,
 * so a screen reader reads a new line when it appears without interrupting.
 */
export function Subtitles() {
  const stopIndex = useDriveStore((s) => s.stopIndex);
  const atStop = useDriveStore((s) => s.atStop);
  const stop = stops[stopIndex];
  const line = atStop && stop?.radioId ? radioLines.find((l) => l.id === stop.radioId) : undefined;

  return (
    <div
      role="region"
      aria-label={simpleCopy.hud.radioLabel}
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-16 z-10 flex justify-center px-4 sm:top-3"
    >
      {line && (
        <p className="bg-night-2/90 text-snow max-w-xl rounded-md px-4 py-2 text-center text-sm shadow-lg sm:max-w-[40vw] sm:text-base">
          <span className="text-hud font-mono">{simpleCopy.hud.radioLabel}:</span> {line.text}
        </p>
      )}
    </div>
  );
}
