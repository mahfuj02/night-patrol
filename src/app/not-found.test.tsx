import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFound from './not-found';

describe('the 404 page', () => {
  it('is a wrong turn with a way back to the drive and the simple version', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: 'Wrong turn, Unit 02' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the drive' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'View the simple version' })).toHaveAttribute(
      'href',
      '/simple',
    );
  });
});
