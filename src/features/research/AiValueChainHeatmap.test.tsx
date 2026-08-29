import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AiValueChainHeatmap } from './AiValueChainHeatmap';

describe('AiValueChainHeatmap component', () => {
  it('renders Morgan Stanley report banner and category filters', () => {
    render(<AiValueChainHeatmap />);
    expect(screen.getByText(/Morgan Stanley Research Exhibit 3/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Infrastructure Value Chain Heatmap/i)).toBeInTheDocument();
    expect(screen.getByText(/LAYER 1: Power Generation/i)).toBeInTheDocument();
  });
});
