'use client';

import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * The inside of the cabin, as a decoration along the bottom edge of the view: the dark dashboard top
 * with the amber glow of the roof light bar, a small Bangladesh flag and a coffee cup on it, and two
 * wipers that sweep the windshield once in a while (CLAUDE.md rule 3 keeps all readable text in the DOM,
 * and there is none here). It is hidden from assistive tech, takes no pointer events, and sits behind
 * the controls. Under reduced motion the wipers stay parked: no continuous motion.
 */
export function CabinOverlay() {
  const reducedMotion = useReducedMotion();
  const wiper = reducedMotion ? '' : 'cabin-wiper';

  return (
    <div
      aria-hidden="true"
      data-testid="cabin"
      data-reduced={reducedMotion}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[5] h-28 overflow-hidden"
    >
      <div className="from-night/95 absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
      <div className="bg-street/20 absolute inset-x-[10%] bottom-14 h-px blur-[1px]" />
      {/* Two wipers, pivoting at the bottom of the windshield. */}
      <div
        className={`${wiper} bg-night absolute bottom-0 left-[32%] h-24 w-[3px] origin-bottom -rotate-[72deg] rounded-full`}
      />
      <div
        className={`${wiper} bg-night absolute bottom-0 left-[62%] h-24 w-[3px] origin-bottom -rotate-[72deg] rounded-full`}
      />
      {/* A Bangladesh flag on a little stand, left of the dash. */}
      <svg viewBox="0 0 60 40" className="absolute bottom-3 left-[6%] h-9 w-14" role="presentation">
        <rect x="0" y="0" width="60" height="40" rx="2" fill="#006a4e" />
        <circle cx="27" cy="20" r="11" fill="#f42a41" />
      </svg>
      {/* A coffee cup in its holder, right of the dash. */}
      <svg viewBox="0 0 40 40" className="absolute right-[6%] bottom-3 h-9 w-9" role="presentation">
        <path d="M8 12h22l-2 22a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" fill="#e8eef5" />
        <rect x="7" y="10" width="24" height="4" rx="2" fill="#14233f" />
        <path d="M30 17h3a4 4 0 0 1 0 8h-3" fill="none" stroke="#e8eef5" strokeWidth="2.5" />
        <path
          d="M15 5c-2 2 2 3 0 5M21 5c-2 2 2 3 0 5"
          fill="none"
          stroke="#ffd27a"
          strokeWidth="1.4"
        />
      </svg>
    </div>
  );
}
