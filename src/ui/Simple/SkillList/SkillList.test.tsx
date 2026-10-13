import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { skills } from '@/content';
import { SkillList } from './SkillList';

describe('SkillList', () => {
  it('groups skills under labelled headings', () => {
    render(<SkillList skills={skills} />);
    for (const name of ['Web', 'Backend', 'Embedded', 'AI tools', 'Mobile']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    }
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('shows a skill note and omits empty groups', () => {
    render(<SkillList skills={skills.filter((s) => s.category === 'backend')} />);
    expect(screen.getByText('C# / .NET (Learning)')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'AI tools' })).not.toBeInTheDocument();
  });
});
