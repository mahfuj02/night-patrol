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
  'dashcam',
  'arcade',
  'inspection-building',
  'warming-shelter',
  'cmhr-esplanade',
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
  /** Site-relative path to the resume PDF. */
  resumePath: z.string().startsWith('/'),
});
export type Profile = z.infer<typeof ProfileSchema>;

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
  images: z.array(z.object({ src: z.string().min(1), alt: z.string().min(1) })),
  /** Projects without a stop appear only in /simple. */
  stopId: kebabId.optional(),
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

export const skillGroups = ['gauge', 'switch', 'indicator', 'preset'] as const;
export const SkillSchema = z.object({
  id: kebabId,
  name: z.string().min(1),
  group: z.enum(skillGroups),
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
  /** The stop the intersection is centred on. */
  stopId: kebabId,
  /** Half the length of the gap, in metres along the road. */
  halfLength: z.number().positive(),
});
export const RouteSchema = z.object({
  points: z.array(RoutePointSchema).min(2),
  /** Gaps in the plowed snowbank ridge and the tree rows, where side streets cross. */
  intersections: z.array(IntersectionSchema).optional(),
});
export type Intersection = z.infer<typeof IntersectionSchema>;
export type RoutePoint = z.infer<typeof RoutePointSchema>;
export type Route = z.infer<typeof RouteSchema>;

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
  skillGroups: z.object({
    gauge: z.string(),
    indicator: z.string(),
    switch: z.string(),
    preset: z.string(),
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
});
export type UiCopy = z.infer<typeof UiCopySchema>;

// Lighting and weather by route zone (see src/content/atmosphere.ts).
const worldTokens = Object.keys(world) as [WorldToken, ...WorldToken[]];
export const WorldTokenSchema = z.enum(worldTokens);
export const lampTypes = ['sodium', 'led', 'warm'] as const;
export type LampType = (typeof lampTypes)[number];

const unit = z.number().min(0).max(1);

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
