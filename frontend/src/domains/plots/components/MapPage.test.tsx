import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../../../test/queryClient';
import { MapPage } from './MapPage';

vi.mock('../../auth', () => ({
  useCurrentUser: () => ({
    user: { id: 'u1', name: 'Ana', email: 'ana@example.com' },
    isLoading: false,
  }),
  useForgetUser: () => () => {},
}));
import { messages } from '../../../shared/i18n/messages';

describe('MapPage', () => {
  it('lays out the map with its toolbar next to the plot panel', () => {
    render(<MapPage />, { wrapper: createQueryWrapper() });

    const map = screen.getByRole('region', { name: messages.map.region });
    expect(map).toContainElement(screen.getByRole('toolbar', { name: messages.map.tools }));
    expect(screen.getByTestId('map').querySelector('.ol-viewport')).not.toBeNull();
    expect(screen.getByRole('complementary', { name: messages.map.panel })).toHaveTextContent(
      messages.panel.plots,
    );
    expect(screen.getByRole('status')).toHaveTextContent(messages.plotsInView.mapLoading);
  });

  it('switches the panel hint with the map mode', async () => {
    render(<MapPage />, { wrapper: createQueryWrapper() });
    const panel = screen.getByRole('complementary', { name: messages.map.panel });

    await userEvent.click(screen.getByRole('button', { name: messages.toolbar.listPlot }));
    expect(panel).toHaveTextContent(messages.hints.drawingPlot);
    expect(panel).toHaveTextContent(messages.drawing.plotShortcuts);
    await userEvent.click(screen.getByRole('button', { name: messages.drawing.undo }));

    await userEvent.click(screen.getByRole('button', { name: messages.toolbar.searchArea }));
    expect(panel).toHaveTextContent(messages.hints.drawingSearch);
    expect(panel).toHaveTextContent(messages.drawing.searchShortcuts);
    expect(screen.queryByRole('button', { name: messages.drawing.undo })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: messages.toolbar.searchArea }));
    expect(panel).toHaveTextContent(messages.hints.idle);
  });
});
