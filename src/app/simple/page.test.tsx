import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { allProjects, projects, simpleCopy, stops } from '@/content';
import SimplePage, { metadata } from './page';

describe('/simple page', () => {
  it('has exactly one h1 and a skip link to main', () => {
    render(<SimplePage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: simpleCopy.skipToContent })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('shows every project and every section heading', () => {
    render(<SimplePage />);
    for (const p of projects) {
      expect(screen.getByRole('heading', { level: 3, name: p.name })).toBeInTheDocument();
    }
    for (const title of Object.values(simpleCopy.sections)) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
  });

  it('leaves out the projects that are not published yet', () => {
    render(<SimplePage />);
    for (const p of allProjects.filter((x) => x.published === false)) {
      expect(screen.queryByText(p.name)).toBeNull();
      expect(screen.queryByRole('heading', { name: p.name })).toBeNull();
    }
  });

  it('covers the content behind every project stop', () => {
    render(<SimplePage />);
    for (const stop of stops.filter((s) => s.kind === 'project')) {
      const project = projects.find((p) => p.id === stop.contentRef);
      expect(project).toBeDefined();
      expect(screen.getByRole('heading', { name: project!.name })).toBeInTheDocument();
    }
  });

  it('embeds Person JSON-LD', () => {
    const { container } = render(<SimplePage />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.textContent!)['@type']).toBe('Person');
  });

  it('declares a canonical URL', () => {
    expect(metadata.alternates?.canonical).toBe('/simple');
  });
});
