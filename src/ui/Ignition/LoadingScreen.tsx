'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { simpleCopy } from '@/content/ui';
import { INTRO_PATIENCE_MS, needleAngle, parseIntroParam } from '@/lib/intro';
import { formatTemplate } from '@/lib/template';
import { useDriveStore } from '@/store/drive';
import { useIntroStore } from '@/store/intro';

const copy = simpleCopy.intro;

/**
 * The Ignition loading screen: a dark dashboard with a fuel gauge that fills as the scene loads
 * (the percentage is also text, and the gauge is a labelled progress bar), then a Start Patrol
 * button, and a Skip to simple view link that is there from the start. Start Patrol fades the screen
 * away (a cut under reduced motion), pulls the car out to the first stop and hands focus to the
 * drive controls. If the scene is slow or stuck, Start Patrol is offered after a wait anyway. With
 * ?intro=off the screen never shows (for tests and direct links). While it is up the rest of the
 * page is inert (see HomeExperience).
 */
export function LoadingScreen() {
  const phase = useIntroStore((s) => s.phase);
  const percent = useIntroStore((s) => s.percent);
  const startButton = useRef<HTMLButtonElement>(null);
  const previous = useRef(phase);

  // ?intro=off skips the screen before anything is shown to the visitor.
  useEffect(() => {
    if (!parseIntroParam(window.location.search)) useIntroStore.getState().start();
  }, []);

  // A slow or stuck load must not trap the visitor: offer Start Patrol after a wait.
  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = window.setTimeout(
      () => useIntroStore.getState().giveUpWaiting(),
      INTRO_PATIENCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase]);

  // When Start Patrol appears the visitor is waiting for it: put focus there. After they press it,
  // the page behind stops being inert and focus goes to the drive controls.
  useEffect(() => {
    if (phase === 'ready') startButton.current?.focus();
    if (phase === 'started' && previous.current === 'ready') {
      document.querySelector<HTMLElement>('[data-drive-next]')?.focus();
    }
    previous.current = phase;
  }, [phase]);

  const start = () => {
    useIntroStore.getState().start();
    // The car pulls out to the first stop (Dispatch).
    useDriveStore.getState().next();
  };

  const started = phase === 'started';
  const ready = phase === 'ready';

  return (
    <section
      aria-label={copy.label}
      aria-hidden={started}
      inert={started}
      data-testid="loading-screen"
      data-phase={phase}
      className="bg-night text-snow fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-6 text-center transition-[opacity,visibility] duration-700 ease-in-out motion-reduce:transition-none"
      style={{
        opacity: started ? 0 : 1,
        visibility: started ? 'hidden' : 'visible',
        pointerEvents: started ? 'none' : 'auto',
      }}
    >
      <h2 className="text-street text-3xl font-semibold">{copy.label}</h2>
      <svg
        role="progressbar"
        aria-label={copy.gauge}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        viewBox="0 0 200 120"
        className="w-72 max-w-full sm:w-96"
      >
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          pathLength="100"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          pathLength="100"
          fill="none"
          stroke="var(--color-street)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${percent} 100`}
        />
        <g
          style={{
            transform: `rotate(${needleAngle(percent)}deg)`,
            transformOrigin: '100px 100px',
            transition: 'transform 300ms ease-out',
          }}
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="34"
            stroke="var(--color-hud)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <circle cx="100" cy="100" r="6" fill="var(--color-hud)" />
        <text
          x="20"
          y="116"
          textAnchor="middle"
          fill="currentColor"
          fontSize="12"
          aria-hidden="true"
        >
          E
        </text>
        <text
          x="180"
          y="116"
          textAnchor="middle"
          fill="currentColor"
          fontSize="12"
          aria-hidden="true"
        >
          F
        </text>
      </svg>
      <p role="status" className="text-snow font-mono text-lg">
        {ready ? copy.ready : formatTemplate(copy.loading, { n: percent })}
      </p>
      <div className="flex flex-col items-center gap-4">
        {ready && (
          <button
            ref={startButton}
            type="button"
            onClick={start}
            className="border-street bg-street text-night focus-visible:outline-hud rounded-md border px-8 py-3 text-lg font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {copy.start}
          </button>
        )}
        <Link
          href="/simple"
          prefetch={false}
          className="text-hud focus-visible:outline-hud text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {copy.skip}
        </Link>
      </div>
    </section>
  );
}
