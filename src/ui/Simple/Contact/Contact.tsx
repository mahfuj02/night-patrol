import { simpleCopy } from '@/content/ui';
import type { Profile } from '@/content/schema';
import { contactItems } from '@/lib/contact';
import { h2Class, linkClass, sectionClass } from '../styles';

export function Contact({ profile }: { profile: Profile }) {
  const labels = {
    email: simpleCopy.links.email,
    linkedin: simpleCopy.links.linkedin,
    github: simpleCopy.links.githubProfile,
    portfolio: simpleCopy.links.portfolio,
  } as const;
  const items = contactItems(profile).map((item) => ({ ...item, label: labels[item.id] }));
  return (
    <section aria-labelledby="contact-heading" className={sectionClass}>
      <h2 id="contact-heading" className={h2Class}>
        {simpleCopy.sections.contact}
      </h2>
      <ul className="text-snow grid gap-3">
        {items.map((item) => (
          <li key={item.href}>
            <span className="text-hud font-mono text-sm">{item.label}: </span>
            <a href={item.href} className={linkClass}>
              {item.text}
            </a>
          </li>
        ))}
        <li>
          <a href={profile.resumeUrl} className={linkClass}>
            {simpleCopy.links.resume}
          </a>
        </li>
      </ul>
    </section>
  );
}
