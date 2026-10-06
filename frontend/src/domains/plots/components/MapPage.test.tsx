import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createQueryWrapper } from '../../../test/queryClient';
import { MapPage } from './MapPage';

describe('MapPage', () => {
  it('lays out the map with its toolbar next to the plot panel', () => {
    render(<MapPage />, { wrapper: createQueryWrapper() });

    const map = screen.getByRole('region', { name: 'Map' });
    expect(map).toContainElement(screen.getByRole('toolbar', { name: 'Map tools' }));
    expect(screen.getByTestId('map').querySelector('.ol-viewport')).not.toBeNull();
    expect(screen.getByRole('complementary', { name: 'Plot panel' })).toHaveTextContent('Plots');
    expect(screen.getByRole('status')).toHaveTextContent('Loading the map…');
  });

  it('switches the panel hint with the map mode', async () => {
    render(<MapPage />, { wrapper: createQueryWrapper() });
    const panel = screen.getByRole('complementary', { name: 'Plot panel' });

    await userEvent.click(screen.getByRole('button', { name: 'List a plot' }));
    expect(panel).toHaveTextContent(/place the plot's corners/);

    await userEvent.click(screen.getByRole('button', { name: 'Search an area' }));
    expect(panel).toHaveTextContent(/set the radius/);

    await userEvent.click(screen.getByRole('button', { name: 'Search an area' }));
    expect(panel).toHaveTextContent(/Pan and zoom/);
  });
});
