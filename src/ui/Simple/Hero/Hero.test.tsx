import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { profile } from '@/content';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders the name as the single h1 with role and location', () => {
    render(<Hero profile={profile} />);
    expect(screen.getByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(profile.role))).toBeInTheDocument();
    expect(screen.getByText(profile.pitch)).toBeInTheDocument();
  });

  it('renders highlights only when present', () => {
    const { rerender } = render(<Hero profile={profile} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    rerender(<Hero profile={{ ...profile, highlights: [] }} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
