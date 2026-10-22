import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CabinOverlay } from './CabinOverlay';

function stubMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduced, addEventListener: () => {}, removeEventListener: () => {} })),
  );
}

describe('CabinOverlay', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is decoration only: hidden from assistive tech, no text, no pointer events', () => {
    stubMotion(false);
    render(<CabinOverlay />);
    const cabin = screen.getByTestId('cabin');
    expect(cabin).toHaveAttribute('aria-hidden', 'true');
    expect(cabin).toHaveClass('pointer-events-none');
    expect(cabin.textContent).toBe('');
  });

  it('sweeps the wipers normally', () => {
    stubMotion(false);
    const { container } = render(<CabinOverlay />);
    expect(container.querySelectorAll('.cabin-wiper')).toHaveLength(2);
  });

  it('keeps the wipers parked under reduced motion', () => {
    stubMotion(true);
    const { container } = render(<CabinOverlay />);
    expect(container.querySelectorAll('.cabin-wiper')).toHaveLength(0);
    expect(screen.getByTestId('cabin')).toHaveAttribute('data-reduced', 'true');
  });
});
