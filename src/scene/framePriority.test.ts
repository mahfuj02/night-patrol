import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** All .tsx files under a folder. */
function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx') ? [path] : [];
  });
}

/** The priority argument of every `useFrame(...)` call in a file (0 when there is none). */
function priorities(source: string): number[] {
  const found: number[] = [];
  let from = 0;
  for (;;) {
    const start = source.indexOf('useFrame(', from);
    if (start < 0) return found;
    let depth = 0;
    let i = start + 'useFrame'.length;
    for (; i < source.length; i++) {
      if (source[i] === '(') depth++;
      if (source[i] === ')' && --depth === 0) break;
    }
    const call = source.slice(start, i);
    const last = /,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(call);
    found.push(last ? Number(last[1]) : 0);
    from = i;
  }
}

describe('useFrame priorities', () => {
  it('are never positive: that would take over rendering and draw nothing without post-processing', () => {
    const files = tsxFiles(join(import.meta.dirname));
    const all = files.flatMap((file) =>
      priorities(readFileSync(file, 'utf8')).map((priority) => ({ file, priority })),
    );
    expect(all.length).toBeGreaterThan(8);
    expect(all.filter((p) => p.priority > 0)).toEqual([]);
  });

  it('reads the priority from a call, and defaults to zero', () => {
    expect(priorities('useFrame((s) => { x(); }, -0.5);')).toEqual([-0.5]);
    expect(priorities('useFrame(() => { f(a, 2); });')).toEqual([0]);
    expect(priorities('useFrame(() => {}, 3); useFrame(() => {}, -1);')).toEqual([3, -1]);
  });
});
