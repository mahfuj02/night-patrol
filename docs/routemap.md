# The route map (transit-map menu)

The route map is a DOM menu that lists the whole route as a vertical transit line. It is the way to reach any stop, station, project, the resume or the contact details in two clicks or fewer. It has no GPU cost: no draw calls or triangles are added.

## What it shows

- **The line**, coloured by zone: Exchange (sodium orange), Downtown (red-orange), Residential (grey-green), Avenue (blue), The Forks (gold). A segment takes the colour of the zone the car is driving toward. Zones are data in `src/content/transit.ts` (each starts at a stop; validated in `integrity.ts`).
- **Stops** are small dots. A stop that hosts a station is drawn as a **ringed circle with a coloured tag** with the section name, and choosing it drives there and opens the station.
- **You are here**: a cyan ring with a car that follows the eased drive progress (written straight to the element each frame, so React does not re-render).
- **Section buttons** above the line, one per built station.
- **Projects**: every project in `projects.ts`. A project opens a details panel (the same markup as the checkpoint panel); **Drive to it** appears only if the project has a route stop.
- **Resume (PDF)** (`profile.resumeUrl`) and **Contact details** (`/simple#contact-heading`).

## Behaviour

- Wide screens (1024px and up): a left-hand panel, open by default and collapsible; the project details open beside it so the right side stays free for the checkpoint panel. Phones: a bottom sheet, closed by default, closing after a choice. The open state is not stored.
- Choosing an entry drives there (a cut under reduced motion). A `role="status"` line says "Driving to {name}…", then "Arrived: {name}" once the eased progress reaches the stop (and the station is parked). It is cleared if the visitor drives elsewhere first.
- Nothing takes focus by itself. Project details take focus when opened; Escape closes them and returns focus to the project button. The details close when the car moves to another stop.
- All copy is in `simpleCopy.menu` (`src/content/ui.ts`).

## Adding a section

Add the station in `stations.ts`; the section button and the ringed entry appear automatically. Add a project to `projects.ts` and it appears in the list; give it a stop through the project's `stopId` for "Drive to it".

Code: `src/ui/RouteMap/`, pure helpers in `src/lib/transit.ts` (tested), `useMediaQuery` in `src/hooks/`.
