import { simpleCopy } from '@/content/ui';
import type { CheckpointView, ResolvedCheckpoint } from '@/lib/checkpoint';

const copy = simpleCopy;
const chipClass = 'rounded-full border border-night bg-night px-3 py-1 text-sm text-snow';
const linkKeys = ['live', 'github', 'caseStudy'] as const;

function ExperienceBody({ view }: { view: Extract<CheckpointView, { kind: 'experience' }> }) {
  return (
    <>
      <p className="text-snow mt-1">{view.org}</p>
      {view.dates && (
        <p className="text-hud mt-1 font-mono text-sm">
          <time dateTime={view.isoDate}>{view.dates}</time>
        </p>
      )}
      {view.summary && <p className="text-snow mt-3">{view.summary}</p>}
      {view.bullets.length > 0 && (
        <ul className="text-snow mt-3 list-disc pl-5">
          {view.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function ProjectBody({ view }: { view: Extract<CheckpointView, { kind: 'project' }> }) {
  return (
    <>
      <p className="text-snow mt-1">{view.tagline}</p>
      <dl className="text-snow mt-4 space-y-3">
        <div>
          <dt className="text-hud font-mono text-sm">{copy.labels.problem}</dt>
          <dd>{view.problem}</dd>
        </div>
        <div>
          <dt className="text-hud font-mono text-sm">{copy.labels.built}</dt>
          <dd>{view.built}</dd>
        </div>
      </dl>
      <h3 className="sr-only">{copy.labels.stack}</h3>
      <ul className="mt-4 flex flex-wrap gap-2">
        {view.stack.map((tech) => (
          <li key={tech} className={chipClass}>
            {tech}
          </li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {linkKeys.map((key) => {
          const href = view.links[key];
          if (!href) return null;
          return (
            <li key={key}>
              <a href={href} className="text-hud underline underline-offset-4">
                {copy.links[key]} <span className="sr-only">for {view.title}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * The words of a checkpoint or a station: the heading, the body for an experience entry or a
 * project, and the teaser line. Used by the side panel, the wall and the bottom sheet, so there is
 * one set of markup for one set of content.
 */
export function CheckpointContent({
  content,
  headingId,
}: {
  content: ResolvedCheckpoint;
  headingId: string;
}) {
  return (
    <>
      <h2 id={headingId} className="text-street pr-8 text-xl font-semibold">
        {content.main.title}
      </h2>
      {content.main.kind === 'experience' ? (
        <ExperienceBody view={content.main} />
      ) : (
        <ProjectBody view={content.main} />
      )}
      {content.teaser && (
        <p className="border-night text-snow mt-4 border-t pt-3 text-sm">
          <span className="text-hud font-mono">{copy.checkpoint.teaser}:</span>{' '}
          {content.teaser.title}
        </p>
      )}
    </>
  );
}
