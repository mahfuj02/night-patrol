/* eslint-disable no-console -- this module is the single sanctioned console wrapper */
const isDev = () => process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev()) console.debug('[night-patrol]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev()) console.warn('[night-patrol]', ...args);
  },
  error: (...args: unknown[]) => {
    if (isDev()) console.error('[night-patrol]', ...args);
  },
};
