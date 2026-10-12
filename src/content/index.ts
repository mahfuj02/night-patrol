import { communityNotes } from './community';
import { experience } from './experience';
import { assertContentIntegrity } from './integrity';
import { profile } from './profile';
import { projects } from './projects';
import { radioLines } from './radio';
import { route } from './route';
import { skills } from './skills';
import { stops } from './stops';

// Fails the build (and any import) if cross-references are broken.
assertContentIntegrity({ route, stops, projects, experience, communityNotes, radioLines });

export { communityNotes, experience, profile, projects, radioLines, route, skills, stops };
export * from './schema';
export { simpleCopy } from './ui';
