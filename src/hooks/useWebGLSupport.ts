'use client';

import { useSyncExternalStore } from 'react';
import { detectWebGL } from '@/lib/webgl';

let cached: boolean | undefined;

// Context creation is not free and the result never changes during a session, so detect once.
function getSnapshot(): boolean {
  cached ??= detectWebGL();
  return cached;
}

const getServerSnapshot = (): null => null;
const subscribe = () => () => {};

/** null on the server and during hydration, then true or false. */
export function useWebGLSupport(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
