import { describe, expect, it } from 'vitest';
import { detectWebGL } from './webgl';

function fakeDoc(getContext: (type: string) => unknown): Document {
  return { createElement: () => ({ getContext }) } as unknown as Document;
}

describe('detectWebGL', () => {
  it('is true when webgl2 is available', () => {
    expect(detectWebGL(fakeDoc((type) => (type === 'webgl2' ? {} : null)))).toBe(true);
  });

  it('falls back to webgl', () => {
    expect(detectWebGL(fakeDoc((type) => (type === 'webgl' ? {} : null)))).toBe(true);
  });

  it('is false when no context can be created', () => {
    expect(detectWebGL(fakeDoc(() => null))).toBe(false);
  });

  it('is false when context creation throws', () => {
    expect(
      detectWebGL(
        fakeDoc(() => {
          throw new Error('nope');
        }),
      ),
    ).toBe(false);
  });
});
