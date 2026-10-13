'use client';

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { experience } from '@/content/experience';
import { projects } from '@/content/projects';
import { stations } from '@/content/stations';
import { simpleCopy } from '@/content/ui';
import { resolveStation } from '@/lib/checkpoint';
import { WALL_DESIGN_WIDTH } from '@/lib/stationCamera';
import { wallDom } from '@/lib/wallDom';
import { useDriveStore } from '@/store/drive';
import { CheckpointContent } from '../CheckpointPanel/CheckpointContent';

const sources = { experience, projects };

/**
 * The content of the station the car is parked at, on its lit wall. It is real DOM, not a texture:
 * laid out at a fixed design size and then placed on the wall by a CSS 3D transform that the scene
 * sets each frame it is on screen (see `WallProjector`), so it stays readable, selectable and in the
 * accessibility tree. It sits outside the hidden 3D container.
 *
 * On a small screen the wall is too small to read, and the same content opens in a bottom sheet as
 * well. Then the wall copy is visual only (hidden from assistive tech and inert) and the sheet is the
 * accessible one, so nothing is read twice.
 */
export function StationWall() {
  const index = useDriveStore((s) => s.station.index);
  const phase = useDriveStore((s) => s.station.phase);
  const legible = useDriveStore((s) => s.wallLegible);
  const closeStation = useDriveStore((s) => s.closeStation);
  const wallHeading = useId();
  const sheetHeading = useId();
  const element = useRef<HTMLDivElement>(null);

  const station = index !== null ? stations[index] : undefined;
  // Keep the last station's content while the car backs out and the wall fades.
  const [last, setLast] = useState(station);
  if (station && station !== last) setLast(station);
  const shown = station ?? last;
  const content = useMemo(() => (shown ? resolveStation(shown, sources) : null), [shown]);

  const designHeight = shown
    ? Math.round((WALL_DESIGN_WIDTH * shown.wall.rect.height) / shown.wall.rect.width)
    : 0;
  useLayoutEffect(() => {
    wallDom.element = element.current;
    wallDom.width = WALL_DESIGN_WIDTH;
    wallDom.height = designHeight || 400;
    return () => {
      wallDom.element = null;
    };
  }, [designHeight]);

  const parked = phase === 'parked';
  const sheet = parked && !legible;
  // The wall is accessible while parked and readable; otherwise it is just a picture.
  const wallAccessible = parked && legible;

  return (
    <>
      <div
        ref={element}
        data-testid="station-wall"
        aria-hidden={!wallAccessible}
        inert={!wallAccessible}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: WALL_DESIGN_WIDTH,
          height: designHeight || undefined,
          transformOrigin: '0 0',
          visibility: 'hidden',
          opacity: 0,
          willChange: 'transform',
        }}
        className="text-snow bg-night/60 z-10 overflow-hidden rounded-lg border border-white/20 p-8 shadow-2xl backdrop-blur-[2px] [&_dd]:text-xl [&_h2]:text-4xl [&_li]:text-xl [&_p]:text-xl"
      >
        {content && wallAccessible ? (
          <section aria-labelledby={wallHeading}>
            <CheckpointContent content={content} headingId={wallHeading} />
          </section>
        ) : (
          content && (
            <div aria-hidden="true">
              <CheckpointContent content={content} headingId={`${wallHeading}-visual`} />
            </div>
          )
        )}
      </div>
      {sheet && content && (
        <aside
          aria-labelledby={sheetHeading}
          className="bg-night-2 text-snow border-hud/40 fixed inset-x-0 bottom-[9.5rem] z-10 max-h-[40dvh] overflow-y-auto rounded-t-xl border p-5 shadow-xl"
        >
          <button
            type="button"
            onClick={closeStation}
            aria-label={simpleCopy.station.leave}
            className="text-snow hover:text-street absolute top-2 right-2 rounded-md px-2 py-1 text-xl leading-none"
          >
            <span aria-hidden="true">×</span>
          </button>
          <CheckpointContent content={content} headingId={sheetHeading} />
        </aside>
      )}
    </>
  );
}
