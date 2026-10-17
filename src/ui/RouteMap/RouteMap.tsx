'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { experience } from '@/content/experience';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { stations } from '@/content/stations';
import { stops } from '@/content/stops';
import { transitZones } from '@/content/transit';
import { simpleCopy } from '@/content/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { resolveProjectDetails } from '@/lib/checkpoint';
import { signedGap } from '@/lib/loopRoute';
import { transit } from '@/lib/palette';
import { STOP_VISITS, patrolLoop as loop } from '@/lib/patrolLoop';
import { formatTemplate } from '@/lib/template';
import {
  buildTransit,
  markerPosition,
  projectEntries,
  segmentZone,
  type ProjectEntry,
  type TransitEntry,
} from '@/lib/transit';
import { progress } from '@/scene/progress';
import { useDriveStore } from '@/store/drive';
import { CheckpointContent } from '../CheckpointPanel/CheckpointContent';

const copy = simpleCopy;
const entries = buildTransit(stops, stations, transitZones);
const projectList = projectEntries(projects, stops);
const sources = { experience, projects };
/** Height of one row of the line, in pixels. The "you are here" marker is placed by it. */
const ROW = 44;

interface Destination {
  name: string;
  /** The stop the car is going to, and the station to open there, if any. */
  stopIndex: number;
  stationIndex: number | null;
}

/** A small car, for the "you are here" marker. */
function CarGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="text-hud">
      <path
        d="M4 14l1.6-4.4A2 2 0 017.5 8h9a2 2 0 011.9 1.6L20 14v4h-2v-1.5H6V18H4v-4zm3.2-3.2L6.4 13h11.2l-.8-2.2a.5.5 0 00-.5-.3H7.7a.5.5 0 00-.5.3zM7 15.2a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2zm10 0a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z"
        fill="currentColor"
      />
    </svg>
  );
}

/** One row of the line: the rail, the dot or ring, and the stop or station. */
function Row({
  entry,
  index,
  current,
  onChoose,
}: {
  entry: TransitEntry;
  index: number;
  current: boolean;
  onChoose: (entry: TransitEntry) => void;
}) {
  const colour = transit[entry.zone];
  const above = index > 0 ? transit[segmentZone(entries, index - 1)] : null;
  const below = index < entries.length - 1 ? transit[segmentZone(entries, index)] : null;
  const section = entry.section ? copy.station.sections[entry.section] : null;
  const name = section
    ? formatTemplate(copy.menu.stationName, { title: entry.title, section })
    : formatTemplate(copy.menu.stopName, {
        title: entry.title,
        n: entry.stopIndex + 1,
        total: entries.length,
      });

  return (
    <li className="relative" style={{ height: ROW }}>
      {above && (
        <span
          aria-hidden="true"
          className="absolute top-0 left-[13px] h-1/2 w-1"
          style={{ background: above }}
        />
      )}
      {below && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-[13px] h-1/2 w-1"
          style={{ background: below }}
        />
      )}
      <button
        type="button"
        onClick={() => onChoose(entry)}
        aria-label={current ? `${name}, ${copy.menu.current}` : name}
        aria-current={current ? 'location' : undefined}
        className="text-snow hover:bg-night/60 relative flex h-full w-full items-center gap-3 rounded-md pr-2 text-left text-sm"
      >
        <span aria-hidden="true" className="flex w-7 shrink-0 justify-center">
          {entry.kind === 'station' ? (
            <span
              className="bg-night-2 block h-5 w-5 rounded-full border-[3px]"
              style={{ borderColor: colour }}
            />
          ) : (
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: colour }} />
          )}
        </span>
        <span aria-hidden="true" className="min-w-0 flex-1 truncate">
          {entry.title}
        </span>
        {section && (
          <span
            aria-hidden="true"
            className="text-night shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: colour }}
          >
            {section}
          </span>
        )}
      </button>
    </li>
  );
}

/**
 * The transit-map menu: the route as a vertical line coloured by zone, with a dot for every stop and
 * a ringed circle and tag for every section station, a cyan ring with a car for "you are here", a
 * button for each built section, the project list, and links to the resume and the contact details.
 * Choosing a stop or station drives there (and a station opens on arrival); under reduced motion the
 * car cuts there. A status line says where the car is going.
 *
 * On a wide screen it is a left-hand panel that collapses, so the right side stays free for the
 * checkpoint panel; on a phone it is a bottom sheet. Nothing here takes focus by itself.
 */
export function RouteMap() {
  const wide = useMediaQuery('(min-width: 1024px)');
  const [chosen, setChosen] = useState<boolean | null>(null);
  const open = chosen ?? wide;
  const panelId = useId();
  const detailsHeading = useId();

  const stopIndex = useDriveStore((s) => s.stopIndex);
  const atStop = useDriveStore((s) => s.atStop);
  const target = useDriveStore((s) => s.target);
  const goal = useDriveStore((s) => s.goal);
  const direction = useDriveStore((s) => s.direction);
  const goToStop = useDriveStore((s) => s.goToStop);
  const goToStation = useDriveStore((s) => s.goToStation);

  const [chosenDestination, setDestination] = useState<Destination | null>(null);
  const [arrivedAt, setArrivedAt] = useState<Destination | null>(null);
  const [openDetails, setOpenDetails] = useState<{
    project: ProjectEntry;
    stopIndex: number;
    atStop: boolean;
  } | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const detailsPanel = useRef<HTMLElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLOListElement>(null);

  // "You are here" moves with the car (the eased progress), written straight to the element.
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const place = () => {
      const el = marker.current;
      if (el) {
        const y = markerPosition(progress.t, entries) * ROW + ROW / 2 - 14;
        el.style.transform = `translateY(${y}px)`;
      }
      // Down the line is outbound, up it is heading back.
      const mark = arrow.current;
      const symbol = progress.direction === 1 ? '▼' : '▲';
      if (mark && mark.textContent !== symbol) mark.textContent = symbol;
      frame = requestAnimationFrame(place);
    };
    frame = requestAnimationFrame(place);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // A destination is forgotten if the visitor drives somewhere else first: the request is still at
  // one of that stop's visits (or waiting for a U-turn to finish).
  const stopVisits = chosenDestination
    ? STOP_VISITS.filter((v) => v.stop === chosenDestination.stopIndex)
    : [];
  const destination =
    chosenDestination &&
    (goal !== null || stopVisits.some((v) => Math.abs(signedGap(loop, target, v.s)) <= 1))
      ? chosenDestination
      : null;

  // The car has arrived once the eased progress reaches a visit to the stop (the store's target
  // moves at once).
  useEffect(() => {
    if (!destination) return;
    const visits = STOP_VISITS.filter((v) => v.stop === destination.stopIndex);
    const check = () => {
      const there = visits.some((v) => Math.abs(signedGap(loop, progress.s, v.s)) < 2.5);
      const parked =
        destination.stationIndex === null ||
        (useDriveStore.getState().station.phase === 'parked' &&
          useDriveStore.getState().station.index === destination.stationIndex);
      if (there && parked) setArrivedAt(destination);
    };
    const timer = window.setInterval(check, 150);
    return () => window.clearInterval(timer);
  }, [destination]);

  // The details panel closes when the car moves on to a different stop.
  const details =
    openDetails && openDetails.stopIndex === stopIndex && openDetails.atStop === atStop
      ? openDetails.project
      : null;
  const setDetails = (project: ProjectEntry | null) =>
    setOpenDetails(project ? { project, stopIndex, atStop } : null);

  const detailsContent = useMemo(
    () => (details ? resolveProjectDetails(details.id, sources) : null),
    [details],
  );

  useEffect(() => {
    if (!details) return;
    detailsPanel.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      setOpenDetails(null);
      opener.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [details]);

  const closeSheet = () => {
    if (!wide) setChosen(false);
  };

  const choose = (entry: TransitEntry) => {
    setDestination({
      name: entry.title,
      stopIndex: entry.stopIndex,
      stationIndex: entry.stationIndex,
    });
    if (entry.stationIndex !== null) goToStation(entry.stationIndex);
    else goToStop(entry.stopIndex);
    closeSheet();
  };

  const chooseSection = (stationIndex: number) => {
    const station = stations[stationIndex];
    const stopIdx = stops.findIndex((s) => s.id === station?.stopId);
    if (!station || stopIdx < 0) return;
    setDestination({
      name: copy.station.sections[station.section],
      stopIndex: stopIdx,
      stationIndex,
    });
    goToStation(stationIndex);
    closeSheet();
  };

  const openProject = (project: ProjectEntry, button: HTMLElement) => {
    opener.current = button;
    setDetails(project);
  };

  const driveToProject = (project: ProjectEntry) => {
    if (project.stopIndex === null) return;
    setDestination({ name: project.name, stopIndex: project.stopIndex, stationIndex: null });
    setDetails(null);
    goToStop(project.stopIndex);
    closeSheet();
  };

  const arrived = destination !== null && arrivedAt === destination;
  const status = destination
    ? formatTemplate(arrived ? copy.menu.arrived : copy.menu.driving, { name: destination.name })
    : '';

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setChosen(!open)}
        className="bg-night-2 text-hud border-hud/40 fixed top-16 left-3 z-20 rounded-md border px-3 py-2 text-sm font-medium"
      >
        {copy.menu.toggle}
      </button>
      <p role="status" className="sr-only">
        {status}
      </p>

      {open && (
        <nav
          id={panelId}
          aria-label={copy.menu.label}
          className="bg-night-2/95 text-snow border-hud/30 fixed inset-x-0 bottom-0 z-30 max-h-[75dvh] overflow-y-auto rounded-t-xl border p-4 shadow-xl lg:inset-x-auto lg:top-28 lg:bottom-36 lg:left-3 lg:z-10 lg:max-h-none lg:w-72 lg:rounded-xl"
        >
          <div className="mb-3 flex items-center justify-between lg:mb-0">
            <h2 className="text-street text-lg font-semibold lg:sr-only">{copy.menu.label}</h2>
            <button
              type="button"
              onClick={() => setChosen(false)}
              aria-label={copy.menu.close}
              className="text-snow hover:text-street rounded-md px-2 py-1 text-xl leading-none lg:hidden"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          {stations.length > 0 && (
            <div role="group" aria-label={copy.menu.sections} className="mb-4 flex flex-wrap gap-2">
              {stations.map((station, i) => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => chooseSection(i)}
                  className="border-street text-street hover:bg-street hover:text-night rounded-full border px-3 py-1 text-sm font-medium"
                >
                  {copy.station.sections[station.section]}
                </button>
              ))}
            </div>
          )}

          <h3 className="text-hud mb-1 font-mono text-xs">
            {copy.menu.route} · {direction === 1 ? copy.drive.outbound : copy.drive.headingBack}
          </h3>
          <div className="relative">
            <ol ref={list} aria-label={copy.menu.route}>
              {entries.map((entry, i) => (
                <Row
                  key={entry.id}
                  entry={entry}
                  index={i}
                  current={i === stopIndex}
                  onChoose={choose}
                />
              ))}
            </ol>
            <span
              ref={marker}
              aria-hidden="true"
              title={copy.menu.youAreHere}
              className="border-hud bg-night pointer-events-none absolute top-0 left-0 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-lg"
              style={{ transform: `translateY(${ROW / 2 - 14}px)` }}
            >
              <CarGlyph />
              <span ref={arrow} className="text-hud absolute -right-3.5 text-[9px]">
                ▼
              </span>
            </span>
          </div>

          <h3 className="text-hud mt-4 mb-2 font-mono text-xs">{copy.menu.projects}</h3>
          <ul className="grid gap-1">
            {projectList.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={(event) => openProject(project, event.currentTarget)}
                  className="text-snow hover:bg-night/60 w-full rounded-md px-2 py-1.5 text-left text-sm"
                >
                  {project.name}
                </button>
              </li>
            ))}
          </ul>

          <ul className="border-night mt-4 grid gap-2 border-t pt-3 text-sm">
            <li>
              <a href={profile.resumeUrl} className="text-hud underline underline-offset-4">
                {copy.menu.resume}
              </a>
            </li>
            <li>
              <a href="/simple#contact-heading" className="text-hud underline underline-offset-4">
                {copy.menu.contact}
              </a>
            </li>
          </ul>
        </nav>
      )}

      {details && detailsContent && (
        <aside
          ref={detailsPanel}
          tabIndex={-1}
          aria-labelledby={detailsHeading}
          className="bg-night-2 text-snow border-hud/40 fixed inset-x-0 bottom-[9.5rem] z-30 max-h-[45dvh] overflow-y-auto rounded-t-xl border p-5 shadow-xl lg:inset-x-auto lg:top-28 lg:bottom-36 lg:left-[19.5rem] lg:z-20 lg:max-h-none lg:w-96 lg:rounded-xl"
        >
          <button
            type="button"
            onClick={() => {
              setDetails(null);
              opener.current?.focus();
            }}
            aria-label={copy.menu.close}
            className="text-snow hover:text-street absolute top-2 right-2 rounded-md px-2 py-1 text-xl leading-none"
          >
            <span aria-hidden="true">×</span>
          </button>
          <CheckpointContent content={detailsContent} headingId={detailsHeading} />
          {details.stopIndex !== null && (
            <button
              type="button"
              onClick={() => driveToProject(details)}
              className="border-street bg-street text-night mt-4 rounded-md border px-4 py-2 text-sm font-semibold"
            >
              {copy.menu.driveToIt}
            </button>
          )}
        </aside>
      )}
    </>
  );
}
