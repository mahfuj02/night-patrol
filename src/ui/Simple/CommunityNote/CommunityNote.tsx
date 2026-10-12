import { simpleCopy } from '@/content/ui';
import type { CommunityNote as CommunityNoteData } from '@/content/schema';
import { h2Class, linkClass, sectionClass } from '../styles';

export function CommunityNote({ note }: { note: CommunityNoteData }) {
  return (
    <section aria-labelledby="community-heading" className={sectionClass}>
      <h2 id="community-heading" className={h2Class}>
        {simpleCopy.sections.community}
      </h2>
      <h3 className="text-snow text-xl font-semibold">{note.title}</h3>
      <p className="text-snow mt-2 max-w-2xl">{note.body}</p>
      <ul className="mt-4 grid gap-2">
        {note.links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className={linkClass}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
