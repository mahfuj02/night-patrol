import { z } from 'zod';
import { world, type WorldToken } from '../lib/palette';

const url = z.url();
/** YYYY or YYYY-MM */
const partialDate = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, 'Expected YYYY or YYYY-MM');
const kebabId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Expected kebab-case id');

export const landmarkIds = [
  'ignition',
  'dispatch-street',
  'rrc-campus',
  'exchange-warehouses',
  'city-services',
  'portage-main',
  'millennium-library',
  'skills-station',
  'dashcam',
  'the-forks',
] as const;
export const LandmarkIdSchema = z.enum(landmarkIds);
export type LandmarkId = z.infer<typeof LandmarkIdSchema>;

export const stopKinds = [
  'intro',
  'education',
  'project',
  'achievement',
  'community',
  'contact',
  /** A section station with no project or entry of its own (the library, the skills building). */
  'section',
] as const;
export const StopKindSchema = z.enum(stopKinds);
export type StopKind = z.infer<typeof StopKindSchema>;

export const ProfileSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  pitch: z.string().min(1),
  highlights: z.array(z.string().min(1)),
  email: z.email(),
  links: z.object({
    github: url,
    linkedin: url,
    portfolio: url,
  }),
  /** Where the resume PDF lives (on mahfuj.dev). */
  resumeUrl: url,
});
export type Profile = z.infer<typeof ProfileSchema>;

/** The shelves of the library. A project sits on one. */
export const projectCategories = ['web', 'mobile', 'systems', 'ai'] as const;
export const ProjectCategorySchema = z.enum(projectCategories);
export type ProjectCategory = z.infer<typeof ProjectCategorySchema>;

export const ProjectSchema = z.object({
  id: kebabId,
  name: z.string().min(1),
  tagline: z.string().min(1),
  problem: z.string().min(1),
  built: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  links: z.object({
    live: url.optional(),
    github: url.optional(),
    caseStudy: url.optional(),
  }),
  /**
   * Pictures for the project's book in the library: WebP files from `scripts/prepare-project-images.mjs`
   * in public/images/projects/. `caption` is a short line under the picture, for example "Concept
   * design" when it is a mock-up and not a capture of the real thing.
   */
  images: z.array(
    z.object({
      src: z.string().regex(/^\/images\/projects\/[a-z0-9-]+\.webp$/),
      alt: z.string().min(1),
      caption: z.string().min(1).optional(),
    }),
  ),
  /**
   * False for a project that is not published yet: it is hidden everywhere (the route, the map,
   * the library and /simple) until the flag is removed. Left out means published.
   */
  published: z.boolean().optional(),
  /** The shelf the project's book stands on in the Millennium Library. */
  category: ProjectCategorySchema,
  /** Projects without a stop appear only in /simple. */
  stopId: kebabId.optional(),
  /** The lit sign on the project's building at its stop: its name and a slogan. */
  sign: z.object({ name: z.string().min(1).max(30), slogan: z.string().min(1).max(80) }).optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const StopSchema = z.object({
  id: kebabId,
  order: z.number().int().nonnegative(),
  /** Position along the path, 0..1. */
  t: z.number().min(0).max(1),
  title: z.string().min(1),
  landmark: LandmarkIdSchema,
  kind: StopKindSchema,
  /** Id of a project, experience entry, or community note. */
  contentRef: kebabId.optional(),
  /** Id of a line in radio.ts. */
  radioId: kebabId.optional(),
});
export type Stop = z.infer<typeof StopSchema>;

export const skillCategories = ['web', 'backend', 'embedded', 'ai', 'mobile'] as const;
export const SkillSchema = z.object({
  id: kebabId,
  name: z.string().min(1),
  category: z.enum(skillCategories),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  note: z.string().min(1).optional(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const ExperienceSchema = z.object({
  id: kebabId,
  kind: z.enum(['work', 'education', 'achievement']),
  title: z.string().min(1),
  org: z.string().min(1),
  location: z.string().min(1).optional(),
  start: partialDate.optional(),
  end: partialDate.optional(),
  summary: z.string().min(1).optional(),
  bullets: z.array(z.string().min(1)),
});
export type Experience = z.infer<typeof ExperienceSchema>;

export const RadioLineSchema = z.object({
  id: kebabId,
  stopId: kebabId,
  text: z.string().min(1),
});
export type RadioLine = z.infer<typeof RadioLineSchema>;

export const CommunityNoteSchema = z.object({
  id: kebabId,
  title: z.string().min(1),
  body: z.string().min(1),
  links: z.array(z.object({ label: z.string().min(1), href: url })).min(1),
});
export type CommunityNote = z.infer<typeof CommunityNoteSchema>;

export const RoutePointSchema = z.object({
  /** East (+x) and south (+z) in scene units. */
  x: z.number(),
  z: z.number(),
  /** Road width at this point; defaults to 8. */
  width: z.number().positive().optional(),
  /** Pins a stop to this point. Every stop appears on exactly one point. */
  stopId: kebabId.optional(),
});
export const IntersectionSchema = z.object({
  id: kebabId,
  /** The stop the intersection is measured from. */
  stopId: kebabId,
  /** Metres along the road from that stop to the intersection centre; negative is before it. */
  offset: z.number().optional(),
  /** Half the length of the gap, in metres along the road. */
  halfLength: z.number().positive(),
  /** The side street that crosses here. Without it the gap stays empty. */
  street: z
    .object({
      width: z.number().positive(),
      /** How far the street runs each side of the route, in metres. */
      length: z.number().positive(),
      /** Degrees off square to the route. */
      skew: z.number().optional(),
    })
    .optional(),
  /** Traffic lights, stop signs on the cross street, or nothing. */
  control: z.enum(['signals', 'stop', 'none']).optional(),
});
export const RouteSchema = z.object({
  points: z.array(RoutePointSchema).min(2),
  /** Length of the route curve in metres. A test keeps it equal to the real curve length. */
  lengthMetres: z.number().positive(),
  /** Gaps in the plowed snowbank ridge and the tree rows, where side streets cross. */
  intersections: z.array(IntersectionSchema).optional(),
});
export type Intersection = z.infer<typeof IntersectionSchema>;

export const SignageSchema = z.object({
  stop: z.string().min(1).max(8),
  rrcRooftop: z.string().min(1).max(30),
  ghostSigns: z.object({
    dryGoods: z.string().min(1).max(30),
    wholesale: z.string().min(1).max(30),
    warehouse: z.string().min(1).max(30),
    grainExchangeSupply: z.string().min(1).max(30),
  }),
  // The City services building: rooftop words, and the request board over its door.
  cityRooftop: z.string().min(1).max(30),
  // The lettering on the Millennium Library: plain words in our own type, no logo.
  libraryLettering: z.string().min(1).max(30),
  requestBoard: z.object({
    statuses: z.tuple([
      z.string().min(1).max(20),
      z.string().min(1).max(20),
      z.string().min(1).max(20),
    ]),
  }),
});
export type Signage = z.infer<typeof SignageSchema>;
export type RoutePoint = z.infer<typeof RoutePointSchema>;
export type Route = z.infer<typeof RouteSchema>;

const unit = z.number().min(0).max(1);

const range2 = z
  .tuple([z.number().positive(), z.number().positive()])
  .refine(([min, max]) => min <= max, 'Expected [min, max]');

const gapRange = z
  .tuple([z.number().min(0), z.number().min(0)])
  .refine(([min, max]) => min <= max, 'Expected [min, max]');

export const BuildingStretchSchema = z.object({
  id: kebabId,
  style: z.enum(['warehouse', 'tower', 'house']),
  /** The stretch runs from this stop (plus `fromOffset` metres along the road) ... */
  from: kebabId,
  fromOffset: z.number().optional(),
  /** ... to this one (plus `toOffset`). */
  to: kebabId,
  toOffset: z.number().optional(),
  /** Metres from the road edge to the building front. */
  setback: z.number().min(0),
  lotWidth: range2,
  /** Gap between neighbouring lots along the road, in metres. A largest gap of 1.5 m or less makes a continuous, attached street wall. */
  gap: gapRange,
  depth: range2,
  height: range2,
  /** Scales the share of windows lit from the zone's `windows` values. */
  lit: unit,
  /** Chance that a lot is built. */
  density: unit,
  /** Chance that a house has a detached garage behind it. */
  garage: unit.optional(),
});
export type BuildingStretch = z.infer<typeof BuildingStretchSchema>;
export type BuildingStyle = BuildingStretch['style'];

export const BackLanesSchema = z.object({
  /** Distance between power poles along a lane, in metres. */
  poleSpacing: z.number().positive(),
  /** How far behind the front of the house row the pole line runs. */
  poleOffset: z.number().positive(),
  poleHeight: z.number().positive(),
  fenceHeight: z.number().positive(),
  /** Chance that a house has back and side fences. */
  fenceChance: unit,
  /** Chance that a house has a pair of city bins. */
  binChance: unit,
});
export type BackLanes = z.infer<typeof BackLanesSchema>;

export const sections = ['education', 'projects', 'experience', 'skills', 'contact'] as const;
export const SectionSchema = z.enum(sections);
export type Section = z.infer<typeof SectionSchema>;

export const StationSchema = z.object({
  id: kebabId,
  section: SectionSchema,
  /** The stop the distances below are measured from. */
  stopId: kebabId,
  /** Where the car stops at the red light, in metres along the road from the stop. */
  light: z.object({ offset: z.number() }),
  bay: z.object({
    turn: z.enum(['left', 'right']),
    /** Gap between the car's nose and the wall, in metres. */
    depth: z.number().positive(),
    width: z.number().positive(),
    /** Road edge cleared of snow ridge and trees before and after the bay, in metres. */
    clearBefore: z.number().positive(),
    clearAfter: z.number().positive(),
  }),
  camera: z.object({
    back: z.number().positive(),
    up: z.number(),
    fov: z.number().positive(),
  }),
  wall: z.object({
    landmark: LandmarkIdSchema,
    rect: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
  }),
  /** What the wall shows (an experience entry or project); the library has none (it lists books). */
  contentRef: kebabId.optional(),
  teaserRef: kebabId.optional(),
});
export type Station = z.infer<typeof StationSchema>;

/** The Millennium Library: its shelves in order, the call number prefix of each, and the featured book. */
export const LibrarySchema = z.object({
  /** The project on the display stand at the entrance. */
  featured: kebabId,
  categories: z
    .array(
      z.object({
        id: ProjectCategorySchema,
        label: z.string().min(1),
        /** The call number prefix, for example WEB in WEB-01. */
        prefix: z.string().regex(/^[A-Z]{2,4}$/),
      }),
    )
    .length(projectCategories.length),
});
export type Library = z.infer<typeof LibrarySchema>;

export const transitZoneIds = ['exchange', 'downtown', 'residential', 'avenue', 'forks'] as const;
export const TransitZoneSchema = z.object({
  id: z.enum(transitZoneIds),
  label: z.string().min(1),
  /** The zone starts at this stop and runs to the next zone's stop. */
  fromStopId: kebabId,
});
export type TransitZone = z.infer<typeof TransitZoneSchema>;

export const UiCopySchema = z.object({
  site: z.object({ title: z.string(), description: z.string() }),
  home: z.object({ heading: z.string(), intro: z.string(), simpleLink: z.string() }),
  drive: z.object({
    navLabel: z.string(),
    prev: z.string(),
    next: z.string(),
    simpleView: z.string(),
    enRoute: z.string(),
    /** Placeholders: {n}, {total}, {title}. */
    atStop: z.string(),
    hint: z.string(),
    loading: z.string(),
    noWebGL: z.string(),
  }),
  pageTitle: z.string(),
  pageDescription: z.string(),
  skipToContent: z.string(),
  sections: z.object({
    projects: z.string(),
    skills: z.string(),
    experience: z.string(),
    community: z.string(),
    contact: z.string(),
  }),
  skillCategories: z.object({
    web: z.string(),
    backend: z.string(),
    embedded: z.string(),
    ai: z.string(),
    mobile: z.string(),
  }),
  links: z.object({
    live: z.string(),
    github: z.string(),
    caseStudy: z.string(),
    resume: z.string(),
    portfolio: z.string(),
    email: z.string(),
    linkedin: z.string(),
    githubProfile: z.string(),
  }),
  labels: z.object({ stack: z.string(), problem: z.string(), built: z.string() }),
  checkpoint: z.object({ teaser: z.string() }),
  hud: z.object({
    radioLabel: z.string(),
    /** Read out at a project stop for screen readers. `{name}` and `{slogan}` are the sign's. */
    sign: z.string(),
  }),
  menu: z.object({
    /** The button that opens the route map, and the map's accessible name. */
    toggle: z.string(),
    label: z.string(),
    sections: z.string(),
    route: z.string(),
    projects: z.string(),
    youAreHere: z.string(),
    /** `{name}` is the stop, station or project. */
    driving: z.string(),
    arrived: z.string(),
    /** Accessible names. `{title}`, `{n}`, `{total}` and `{section}` are filled in. */
    stopName: z.string(),
    stationName: z.string(),
    current: z.string(),
    close: z.string(),
    driveToIt: z.string(),
    resume: z.string(),
    contact: z.string(),
    projectDetails: z.string(),
  }),
  skills: z.object({
    /** A skill's level as text: `{n}` is 1 to 5. */
    levelOf: z.string(),
    /** The heading of the lines that are not graded skills (from `profile.highlights`). */
    also: z.string(),
  }),
  library: z.object({
    /** The catalog terminal: its name, the search box and the filter group. */
    catalog: z.string(),
    searchLabel: z.string(),
    searchPlaceholder: z.string(),
    filters: z.string(),
    all: z.string(),
    /** Read out as the search changes. */
    countOne: z.string(),
    /** `{n}` is the number of books. */
    countMany: z.string(),
    none: z.string(),
    /** The shelf of books, and one book's button label: `{call}` and `{name}`. */
    shelf: z.string(),
    bookButton: z.string(),
    featured: z.string(),
    /** The open book: its name for assistive tech, the back button and the page links. */
    book: z.string(),
    back: z.string(),
    checkOut: z.string(),
    source: z.string(),
    caseStudy: z.string(),
    /** The typographic cover shown when a project has no picture: `{call}` is its call number. */
    cover: z.string(),
  }),
  station: z.object({
    /** The Open button. `{section}` is the section name. */
    open: z.string(),
    /** Read out when a station opens. */
    opened: z.string(),
    leave: z.string(),
    sections: z.object({
      education: z.string(),
      projects: z.string(),
      experience: z.string(),
      skills: z.string(),
      contact: z.string(),
    }),
  }),
});
export type UiCopy = z.infer<typeof UiCopySchema>;

// Lighting and weather by route zone (see src/content/atmosphere.ts).
const worldTokens = Object.keys(world) as [WorldToken, ...WorldToken[]];
export const WorldTokenSchema = z.enum(worldTokens);
export const lampTypes = ['sodium', 'led', 'warm'] as const;
export type LampType = (typeof lampTypes)[number];

export const AtmosphereZoneSchema = z.object({
  id: kebabId,
  /** The zone holds its values from the `from` stop to the `to` stop (plus offsets, in `t`). */
  from: kebabId,
  to: kebabId,
  startOffset: z.number().optional(),
  endOffset: z.number().optional(),
  /** Length in `t` over which the previous zone eases into this one, ending where this zone starts. */
  blend: z.number().min(0),
  sky: z.object({ zenith: WorldTokenSchema, horizon: WorldTokenSchema }),
  fog: z.object({ color: WorldTokenSchema, near: z.number().min(0), far: z.number().positive() }),
  light: z.object({
    type: z.enum(lampTypes),
    color: WorldTokenSchema,
    intensity: z.number().min(0),
  }),
  ambient: z.object({ color: WorldTokenSchema, intensity: z.number().min(0) }),
  snow: z.object({ density: unit, wind: unit, gust: unit }),
  /** How densely bare elms line the road in this zone, 0..1. */
  trees: unit,
  moon: unit,
  sunrise: unit,
  /** Mix of lit window tones; used by the buildings in Phase 3b. */
  windows: z.object({ warm: unit, cool: unit }),
});
export type AtmosphereZone = z.infer<typeof AtmosphereZoneSchema>;
