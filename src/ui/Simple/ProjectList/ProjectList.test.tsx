import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { projects } from '@/content';
import { ProjectList } from './ProjectList';

describe('ProjectList', () => {
  it('renders every project with its own h3', () => {
    render(<ProjectList projects={projects} />);
    for (const p of projects) {
      expect(screen.getByRole('heading', { level: 3, name: p.name })).toBeInTheDocument();
    }
  });

  it('renders only the links that are set, with accessible names', () => {
    render(<ProjectList projects={projects} />);
    const roleready = screen.getByRole('article', { name: 'RoleReady' });
    expect(
      within(roleready).getByRole('link', { name: /Live site for RoleReady/ }),
    ).toHaveAttribute('href', 'https://role-ready-snowy.vercel.app');
    expect(within(roleready).queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument();
  });

  it('is reachable with the keyboard', async () => {
    const user = userEvent.setup();
    render(<ProjectList projects={projects} />);
    await user.tab();
    expect(screen.getAllByRole('link')[0]).toHaveFocus();
  });
});
