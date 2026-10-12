import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('logs outside production', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('hello');
    expect(spy).toHaveBeenCalledWith('[night-patrol]', 'hello');
  });

  it('is silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('hidden');
    expect(spy).not.toHaveBeenCalled();
  });
});
