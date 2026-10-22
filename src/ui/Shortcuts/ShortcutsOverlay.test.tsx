import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ShortcutsOverlay } from './ShortcutsOverlay';

describe('ShortcutsOverlay', () => {
  it('is shut until asked, and opens with the ? key', async () => {
    const user = userEvent.setup();
    render(<ShortcutsOverlay />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.keyboard('?');
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    expect(screen.getAllByText('Brake to a stop').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('opens from the ? button and closes with Escape, giving focus back', async () => {
    const user = userEvent.setup();
    render(<ShortcutsOverlay />);
    const opener = screen.getByRole('button', { name: 'Keyboard shortcuts' });
    await user.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('closes with the Close button and keeps focus inside while open', async () => {
    const user = userEvent.setup();
    render(<ShortcutsOverlay />);
    await user.keyboard('?');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ignores ? typed into a field and modified shortcuts', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="field" />
        <ShortcutsOverlay />
      </>,
    );
    await user.click(screen.getByLabelText('field'));
    await user.keyboard('?');
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', ctrlKey: true, bubbles: true }),
      );
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
