import { simpleCopy } from '@/content/ui';
import type { Project } from '@/content/schema';
import { cardClass, chipClass, h2Class, linkClass, sectionClass } from '../styles';

const linkKeys = ['live', 'github', 'caseStudy'] as const;

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <section aria-labelledby="projects-heading" className={sectionClass}>
      <h2 id="projects-heading" className={h2Class}>
        {simpleCopy.sections.projects}
      </h2>
      <ul className="grid gap-6">
        {projects.map((project) => (
          <li key={project.id}>
            <article className={cardClass} aria-labelledby={`project-${project.id}`}>
              <h3 id={`project-${project.id}`} className="text-snow text-xl font-semibold">
                {project.name}
              </h3>
              <p className="text-snow mt-1">{project.tagline}</p>
              <dl className="text-snow mt-4 space-y-3">
                <div>
                  <dt className="text-hud font-mono text-sm">{simpleCopy.labels.problem}</dt>
                  <dd>{project.problem}</dd>
                </div>
                <div>
                  <dt className="text-hud font-mono text-sm">{simpleCopy.labels.built}</dt>
                  <dd>{project.built}</dd>
                </div>
              </dl>
              <h4 className="sr-only">{simpleCopy.labels.stack}</h4>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <li key={tech} className={chipClass}>
                    {tech}
                  </li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {linkKeys.map((key) => {
                  const href = project.links[key];
                  if (!href) return null;
                  return (
                    <li key={key}>
                      <a href={href} className={linkClass}>
                        {simpleCopy.links[key]} <span className="sr-only">for {project.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
