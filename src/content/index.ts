/**
 * Validated content. Importing this module parses every content file with its zod schema and
 * checks cross-references, so a mistake fails `pnpm test` and `pnpm build`.
 *
 * Use it from server code and tests only. Client components import the plain data files
 * (`@/content/stops`, `@/content/route`, `@/content/ui`) directly: that keeps zod and the whole
 * content layer out of the browser bundle.
 */
import { z } from 'zod';
import { atmosphereZones as atmosphereZonesData } from './atmosphere';
import { backLanes as backLanesData } from './backLanes';
import { buildingStretches as buildingStretchesData } from './buildings';
import { checkpoints as checkpointsData } from './checkpoints';
import { communityNotes as communityNotesData } from './community';
import { experience as experienceData } from './experience';
import { assertContentIntegrity } from './integrity';
import { profile as profileData } from './profile';
import { projects as projectsData } from './projects';
import { radioLines as radioLinesData } from './radio';
import { route as routeData } from './route';
import {
  AtmosphereZoneSchema,
  BackLanesSchema,
  CheckpointSchema,
  BuildingStretchSchema,
  CommunityNoteSchema,
  ExperienceSchema,
  ProfileSchema,
  ProjectSchema,
  RadioLineSchema,
  RouteSchema,
  SignageSchema,
  SkillSchema,
  StationSchema,
  TransitZoneSchema,
  StopSchema,
  UiCopySchema,
} from './schema';
import { signage as signageData } from './signage';
import { skills as skillsData } from './skills';
import { stations as stationsData } from './stations';
import { stops as stopsData } from './stops';
import { transitZones as transitZonesData } from './transit';
import { simpleCopy as simpleCopyData } from './ui';

export const atmosphereZones = z.array(AtmosphereZoneSchema).parse(atmosphereZonesData);
export const backLanes = BackLanesSchema.parse(backLanesData);
export const buildingStretches = z.array(BuildingStretchSchema).parse(buildingStretchesData);
export const checkpoints = z.array(CheckpointSchema).parse(checkpointsData);
export const communityNotes = z.array(CommunityNoteSchema).parse(communityNotesData);
export const experience = z.array(ExperienceSchema).parse(experienceData);
export const profile = ProfileSchema.parse(profileData);
export const projects = z.array(ProjectSchema).parse(projectsData);
export const radioLines = z.array(RadioLineSchema).parse(radioLinesData);
export const route = RouteSchema.parse(routeData);
export const signage = SignageSchema.parse(signageData);
export const skills = z.array(SkillSchema).parse(skillsData);
export const stations = z.array(StationSchema).parse(stationsData);
export const transitZones = z.array(TransitZoneSchema).parse(transitZonesData);
export const stops = z.array(StopSchema).parse(stopsData);
export const simpleCopy = UiCopySchema.parse(simpleCopyData);

assertContentIntegrity({
  atmosphere: atmosphereZones,
  buildings: buildingStretches,
  checkpoints,
  stations,
  transitZones,
  route,
  stops,
  projects,
  experience,
  communityNotes,
  radioLines,
});

export * from './schema';
