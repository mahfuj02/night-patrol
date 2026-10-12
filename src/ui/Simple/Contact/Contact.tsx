import { simpleCopy } from '@/content/ui';
import type { Profile } from '@/content/schema';
import { h2Class, linkClass, sectionClass } from '../styles';

export function Contact({ profile }: { profile: Profile }) {
  const items = [
    { label: simpleCopy.links.email, href: `mailto:${profile.email}`, text: profile.email },
    {
      label: simpleCopy.links.linkedin,
      href: profile.links.linkedin,
      text: profile.links.linkedin,
    },
    {
      label: simpleCopy.links.githubProfile,
      href: profile.links.github,
      text: profile.links.github,
    },
    {
      label: simpleCopy.links.portfolio,
      href: profile.links.portfolio,
      text: profile.links.portfolio,
    },
  ];
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
          <a href={profile.resumePath} className={linkClass}>
            {simpleCopy.links.resume}
          </a>
        </li>
      </ul>
    </section>
  );
}
