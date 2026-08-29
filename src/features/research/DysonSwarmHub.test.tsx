import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DysonSwarmHub } from './DysonSwarmHub';

describe.skip('DysonSwarmHub component', () => {
  it('renders Dyson Swarm header and telemetry indicators', () => {
    render(<DysonSwarmHub />);
    expect(screen.getAllByText(/Dyson Swarm/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Working Starlink Sats/i)).toBeInTheDocument();
  });
});

