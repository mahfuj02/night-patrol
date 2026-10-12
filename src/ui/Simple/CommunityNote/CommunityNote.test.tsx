import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { communityNotes } from '@/content';
import { CommunityNote } from './CommunityNote';

describe('CommunityNote', () => {
  it('renders the note and its resource links', () => {
    const note = communityNotes[0]!;
    render(<CommunityNote note={note} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Community' })).toBeInTheDocument();
    expect(screen.getByText(note.body)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Siloam Mission' })).toHaveAttribute(
      'href',
      'https://www.siloam.ca/',
    );
    expect(screen.getAllByRole('link')).toHaveLength(note.links.length);
  });
});
