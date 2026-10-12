import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { profile } from '@/content';
import { Contact } from './Contact';

describe('Contact', () => {
  it('links email, profiles, portfolio and resume', () => {
    render(<Contact profile={profile} />);
    expect(screen.getByRole('link', { name: profile.email })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`,
    );
    expect(screen.getByRole('link', { name: profile.links.github })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: profile.links.linkedin })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: profile.links.portfolio })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download resume (PDF)' })).toHaveAttribute(
      'href',
      '/resume.pdf',
    );
  });

  it('never exposes a phone number', () => {
    const { container } = render(<Contact profile={profile} />);
    expect(container.innerHTML).not.toMatch(/tel:/);
  });

  it('tabs through every link in order', async () => {
    const user = userEvent.setup();
    render(<Contact profile={profile} />);
    for (const link of screen.getAllByRole('link')) {
      await user.tab();
      expect(link).toHaveFocus();
    }
  });
});
