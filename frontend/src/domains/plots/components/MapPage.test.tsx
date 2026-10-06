import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MapPage } from './MapPage';

describe('MapPage', () => {
  it('lays out the map with its toolbar next to the plot panel', () => {
    render(<MapPage />);

    const map = screen.getByRole('region', { name: 'Map' });
    expect(map).toContainElement(screen.getByRole('toolbar', { name: 'Map tools' }));
    expect(screen.getByTestId('map').querySelector('.ol-viewport')).not.toBeNull();
    expect(screen.getByRole('complementary', { name: 'Plot panel' })).toHaveTextContent('Plots');
  });
});
