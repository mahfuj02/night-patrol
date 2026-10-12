import { z } from 'zod';

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
