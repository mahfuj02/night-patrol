import type { Metadata } from 'next';
import { communityNotes, experience, profile, projects, simpleCopy, skills } from '@/content';
import { buildPersonJsonLd, serializeJsonLd } from '@/lib/jsonld';
import { getSiteUrl } from '@/lib/site';
import { CommunityNote } from '@/ui/Simple/CommunityNote';
import { Contact } from '@/ui/Simple/Contact';
import { ExperienceList } from '@/ui/Simple/ExperienceList';
import { Hero } from '@/ui/Simple/Hero';
import { ProjectList } from '@/ui/Simple/ProjectList';
import { SkillList } from '@/ui/Simple/SkillList';

export const metadata: Metadata = {
  title: simpleCopy.pageTitle,
  description: simpleCopy.pageDescription,
  alternates: { canonical: '/simple' },
  openGraph: {
    title: simpleCopy.pageTitle,
    description: simpleCopy.pageDescription,
    url: '/simple',
    type: 'profile',
  },
};

export default function SimplePage() {
  const jsonLd = buildPersonJsonLd(profile, `${getSiteUrl()}/simple`);
  return (
    <>
      <a
        href="#main"
        className="bg-night text-hud sr-only z-10 p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {simpleCopy.skipToContent}
      </a>
      <Hero profile={profile} />
      <main id="main">
        <ProjectList projects={projects} />
        <SkillList skills={skills} />
        <ExperienceList entries={experience} />
        {communityNotes.map((note) => (
          <CommunityNote key={note.id} note={note} />
        ))}
        <Contact profile={profile} />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
    </>
  );
}
