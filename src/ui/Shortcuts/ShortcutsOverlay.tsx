'use client';

import { useEffect, useRef, useState } from 'react';
import { simpleCopy } from '@/content/ui';
import { isInteractiveTarget } from '@/lib/driveInput';

const copy = simpleCopy.shortcuts;

/**
 * The keyboard shortcuts overlay: a small "?" button (so mouse users can find it too) and the `?` key
 * open a dialog listing every way to drive. Escape or the Close button shuts it and puts focus back
 * where it came from. It never drives the car.
 */
export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '?' && !isInteractiveTarget(event.target)) {
        opener.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === 'Tab') {
        // The close button is the only control: keep focus on it.
        event.preventDefault();
        closeButton.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      opener.current?.focus?.();
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={copy.open}
        onClick={(event) => {
          opener.current = event.currentTarget;
          setOpen(true);
        }}
        className="bg-night-2 text-hud border-hud/40 fixed bottom-4 left-3 z-10 hidden h-9 w-9 rounded-full border text-base font-semibold sm:block"
      >
        ?
      </button>
      {open && (
        <div className="bg-night/70 fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-heading"
            className="bg-night-2 text-snow border-hud/40 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-xl border p-5 shadow-xl"
          >
            <h2 id="shortcuts-heading" className="text-street mb-3 text-lg font-semibold">
              {copy.heading}
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {copy.items.map((item) => (
                <div key={item.keys} className="contents">
                  <dt className="text-hud font-mono">{item.keys}</dt>
                  <dd>{item.action}</dd>
                </div>
              ))}
            </dl>
            <button
              ref={closeButton}
              type="button"
              onClick={() => setOpen(false)}
              className="border-street bg-street text-night mt-4 rounded-md border px-4 py-2 text-sm font-semibold"
            >
              {copy.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
