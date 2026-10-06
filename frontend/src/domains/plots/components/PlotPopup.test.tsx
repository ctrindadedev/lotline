import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PlotFeature } from '../types';
import { PlotPopup } from './PlotPopup';

const PLOT: PlotFeature = {
  type: 'Feature',
  id: 'plot-1',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-47, -22],
        [-46.999, -22],
        [-46.999, -21.999],
        [-47, -21.999],
        [-47, -22],
      ],
    ],
  },
  properties: {
    price: 150000,
    description: 'Corner plot\nNear the park',
    contact: '+55 19 99999-0000',
    createdAt: '2026-10-06T15:00:00Z',
  },
};

describe('PlotPopup', () => {
  it('shows the price, area, price per m², description, contact and listing date', () => {
    render(<PlotPopup plot={PLOT} onClose={() => {}} />);
    const popup = screen.getByRole('dialog', { name: 'Plot details' });

    expect(popup).toHaveTextContent('R$150,000.00');
    expect(popup).toHaveTextContent('1.15 ha · R$13.08/m²');
    expect(popup).toHaveTextContent('Corner plot Near the park');
    expect(popup).toHaveTextContent('Contact: +55 19 99999-0000');
    expect(popup).toHaveTextContent('Listed on Oct 6, 2026');
  });

  it('closes from its close button', async () => {
    const onClose = vi.fn<() => void>();
    render(<PlotPopup plot={PLOT} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
