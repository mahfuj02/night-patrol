import type { Profile } from '@/content/schema';
import { sectionClass } from '../styles';

export function Hero({ profile }: { profile: Profile }) {
  return (
    <header className={sectionClass}>
      <h1 className="text-snow text-4xl font-semibold sm:text-5xl">{profile.name}</h1>
      <p className="text-hud mt-2 font-mono text-lg">
        {profile.role} · {profile.location}
      </p>
      <p className="text-snow mt-6 max-w-2xl text-lg">{profile.pitch}</p>
      {profile.highlights.length > 0 && (
        <ul className="text-snow mt-4 list-disc pl-5">
          {profile.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
    </header>
  );
}
