import { Stats } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

const UPDATE_EVERY_FRAMES = 20;

/**
 * Development-only performance overlay: an fps/ms panel (Drei Stats) plus draw calls and
 * triangles from the renderer. Compare these with the budgets in PROJECT_PLAN §5.5.
 * Experience loads this lazily only when NODE_ENV is "development".
 */
export default function DevStats() {
  const gl = useThree((state) => state.gl);
  const label = useRef<HTMLDivElement | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText =
      'position:fixed;left:0;top:48px;z-index:50;padding:2px 6px;font:11px monospace;' +
      'color:#4fe3e3;background:rgba(11,20,38,.85);pointer-events:none';
    document.body.append(el);
    label.current = el;
    return () => {
      el.remove();
      label.current = null;
    };
  }, []);

  useFrame(() => {
    frame.current += 1;
    if (frame.current % UPDATE_EVERY_FRAMES !== 0 || !label.current) return;
    const { calls, triangles } = gl.info.render;
    label.current.textContent = `calls ${calls} / tris ${triangles.toLocaleString()}`;
  });

  return <Stats />;
}
