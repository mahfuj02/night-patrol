'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef } from 'react';
import { simpleCopy } from '@/content/ui';
import { useDriveInput } from '@/hooks/useDriveInput';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useIntroStore } from '@/store/intro';
import { DriveControls } from '@/ui/DriveControls';
import { ShiftFade, Subtitles } from '@/ui/Hud';
import { LoadingScreen } from '@/ui/Ignition';
import { ContactPanel } from '@/ui/Contact';
import { ExperiencePanel } from '@/ui/Experience';
import { LibraryPanel } from '@/ui/Library';
import { RouteMap } from '@/ui/RouteMap';
import { SkillsPanel } from '@/ui/Skills';
import { CabinOverlay } from '@/ui/Cabin';
import { ShortcutsOverlay } from '@/ui/Shortcuts';
import { SoundDriver, SoundToggle } from '@/ui/Sound';
import { StationControls, StationWall } from '@/ui/Station';

// The 3D scene is only ever loaded in the browser, and only when WebGL is available.
const Experience = dynamic(() => import('@/scene/Experience').then((m) => m.Experience), {
  ssr: false,
});

const copy = simpleCopy;

/**
 * The home page body. The page itself never scrolls: wheel, touch and key input drive the car
 * instead. Listeners are attached to the scene container only (plus a key handler that ignores
 * focused controls), so Tab, links, buttons and screen readers keep working normally.
 */
export function HomeExperience() {
  const webgl = useWebGLSupport();
  const reducedMotion = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  // While the Ignition loading screen is up nothing drives the car and the page behind it is inert.
  const introActive = useIntroStore((s) => s.phase !== 'started') && webgl === true;
  useDriveInput(container, reducedMotion, !introActive);

  if (webgl === false) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-street text-4xl font-semibold">{copy.home.heading}</h1>
        <p className="text-snow max-w-md">{copy.drive.noWebGL}</p>
        <Link href="/simple" prefetch={false} className="text-hud underline underline-offset-4">
          {copy.home.simpleLink}
        </Link>
      </main>
    );
  }

  return (
    <main className="relative h-dvh w-full touch-pinch-zoom overflow-hidden select-none">
      <h1 className="bg-night-2 text-street fixed top-3 left-3 z-10 rounded-md px-3 py-2 text-lg font-semibold">
        {copy.home.heading}
      </h1>
      <div ref={container} aria-hidden="true" className="absolute inset-0">
        {webgl === true ? (
          <Experience />
        ) : (
          <p className="text-snow flex h-full items-center justify-center font-mono">
            {copy.drive.loading}
          </p>
        )}
      </div>
      {webgl === true && <LoadingScreen />}
      <div inert={introActive} className="contents">
        <DriveControls />
        <StationControls />
        <RouteMap />
        <StationWall />
        <LibraryPanel />
        <SkillsPanel />
        <ExperiencePanel />
        <ContactPanel />
        <Subtitles />
        <CabinOverlay />
        <ShiftFade />
        <ShortcutsOverlay />
        <SoundToggle />
        <SoundDriver />
      </div>
      <noscript>
        <Link href="/simple" className="text-hud fixed bottom-4 left-4 underline">
          {copy.home.simpleLink}
        </Link>
      </noscript>
    </main>
  );
}
