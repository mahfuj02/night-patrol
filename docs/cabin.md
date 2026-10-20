# The cabin

Phase 6. The view stays the chase camera outside the car; the inside of the cabin is a decoration along the bottom edge (`src/ui/Cabin/CabinOverlay.tsx`, mounted in `HomeExperience`):

- the dark top of the dashboard with the faint amber glow of the roof light bar,
- a small Bangladesh flag and a coffee cup, as flat vector props,
- two wipers that sweep the windshield once every ten seconds (`cabin-wipe` in `globals.css`).

It is hidden from assistive tech, carries no text, takes no pointer events and sits behind the controls. Under `prefers-reduced-motion` the wipers stay parked. The skills and the experience are explored at their stations (`docs/skills-station.md`, `docs/experience-station.md`), which replaced the dashboard gauges and the patrol log panel of the first plan.
