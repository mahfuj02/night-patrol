import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(['debug', 'warn', 'error'] as const)('%s logs outside production', (level) => {
    const spy = vi.spyOn(console, level).mockImplementation(() => {});
    logger[level]('hello');
    expect(spy).toHaveBeenCalledWith('[night-patrol]', 'hello');
  });

  it.each(['debug', 'warn', 'error'] as const)('%s is silent in production', (level) => {
    vi.stubEnv('NODE_ENV', 'production');
    const spy = vi.spyOn(console, level).mockImplementation(() => {});
    logger[level]('hidden');
    expect(spy).not.toHaveBeenCalled();
  });
});
