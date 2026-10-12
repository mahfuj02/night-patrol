import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home page', () => {
  it('renders the project heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Night Patrol' })).toBeInTheDocument();
  });

  it('links to the simple version', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'View the simple version' })).toHaveAttribute(
      'href',
      '/simple',
    );
  });
});
