import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { experience } from '@/content';
import { ExperienceList } from './ExperienceList';

describe('ExperienceList', () => {
  it('renders each entry with title, organisation and date range', () => {
    render(<ExperienceList entries={experience} />);
    const liilab = screen.getByRole('article', { name: 'Junior Software Engineer' });
    expect(within(liilab).getByText(/LIILAB · Sylhet, Bangladesh/)).toBeInTheDocument();
    expect(within(liilab).getByText('Feb 2021 – Oct 2022')).toBeInTheDocument();
    expect(within(liilab).getAllByRole('listitem')).toHaveLength(4);
  });

  it('omits date and bullet blocks when absent', () => {
    render(
      <ExperienceList
        entries={[{ id: 'x', kind: 'work', title: 'Bare', org: 'Org', bullets: [] }]}
      />,
    );
    const article = screen.getByRole('article', { name: 'Bare' });
    expect(within(article).queryByRole('list')).not.toBeInTheDocument();
    expect(article.querySelector('time')).toBeNull();
  });
});
