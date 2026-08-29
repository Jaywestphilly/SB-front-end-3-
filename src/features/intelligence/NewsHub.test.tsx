import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NewsHub } from './NewsHub';

describe('NewsHub component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ intel_feed: [], videos: [] })
      });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders intelligence feed header and filters', () => {
    render(<NewsHub />);
    expect(screen.getAllByText(/ALL FEEDS/i).length).toBeGreaterThan(0);
  });
});


