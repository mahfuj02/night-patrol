import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

vi.mock('@/hooks/useWebGLSupport', () => ({ useWebGLSupport: () => false }));

describe('Home page', () => {
  it('renders the project heading and a way to the simple version', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Night Patrol' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View the simple version' })).toHaveAttribute(
      'href',
      '/simple',
    );
  });
});
