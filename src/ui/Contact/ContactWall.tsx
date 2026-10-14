import { profile } from '@/content/profile';
import { simpleCopy } from '@/content/ui';

/**
 * The market's lit wall, seen from the car: the headline ways to reach the owner. It is a picture
 * only (the accessible links are the contact panel), so the wall always hides it from assistive
 * tech. It is real DOM so the wall stays crisp, not a texture.
 */
export function ContactWall() {
  return (
    <div>
      <h2 className="text-street text-4xl font-semibold">{simpleCopy.station.sections.contact}</h2>
      <p className="text-snow mt-3 font-mono text-2xl break-all">{profile.email}</p>
      <p className="text-hud mt-2 font-mono text-xl">{profile.links.portfolio}</p>
    </div>
  );
}
