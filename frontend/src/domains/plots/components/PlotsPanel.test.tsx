import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import type { PanelTab } from '../hooks/usePlotsPanel';
import type { PlotFeature } from '../types';
import { MapLegend } from './MapLegend';
import { PlotsPanel } from './PlotsPanel';

const text = messages.plotsPanel;

const PLOT: PlotFeature = {
  type: 'Feature',
  id: 'plot-1',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-47, -22],
        [-46.99, -22],
        [-46.99, -21.99],
        [-47, -21.99],
        [-47, -22],
      ],
    ],
  },
  properties: {
    price: 150000,
    description: 'Corner plot',
    createdAt: '2026-10-07T12:00:00Z',
    status: 'RESERVED',
    reservable: true,
    ownedByMe: false,
    reservedByMe: true,
  },
};

function renderPanel(
  tab: PanelTab,
  plots: PlotFeature[],
  extra: Partial<{ loading: boolean; failed: boolean; tabs: PanelTab[] }> = {},
) {
  const onSelectTab = vi.fn<(tab: PanelTab) => void>();
  const onSelectPlot = vi.fn<(plot: PlotFeature) => void>();
  render(
    <PlotsPanel
      tab={tab}
      tabs={extra.tabs ?? ['area', 'mine', 'reserved']}
      onSelectTab={onSelectTab}
      plots={plots}
      areaStatus="1 terreno nesta área."
      myPlotsLoading={extra.loading ?? false}
      myPlotsFailed={extra.failed ?? false}
      selectedId={null}
      onSelectPlot={onSelectPlot}
    />,
  );
  return { onSelectTab, onSelectPlot };
}

describe('PlotsPanel', () => {
  it('lists the plots as cards that open the plot', async () => {
    const { onSelectPlot } = renderPanel('area', [PLOT]);

    expect(screen.getByRole('status')).toHaveTextContent('1 terreno nesta área.');
    const card = screen.getByRole('button', { name: /150\.000,00/ });
    expect(card).toHaveTextContent(messages.popup.reservedByYou);
    expect(card).toHaveTextContent('Corner plot');
    await userEvent.click(card);

    expect(onSelectPlot).toHaveBeenCalledWith(PLOT);
  });

  it('switches tabs', async () => {
    const { onSelectTab } = renderPanel('area', []);

    await userEvent.click(screen.getByRole('tab', { name: text.tabs.reserved }));

    expect(onSelectTab).toHaveBeenCalledWith('reserved');
  });

  it('hides the tabs from visitors', () => {
    renderPanel('area', [], { tabs: ['area'] });

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it.each([
    ['mine', {}, text.noneListed],
    ['reserved', {}, text.noneReserved],
    ['mine', { loading: true }, text.loadingMine],
    ['reserved', { failed: true }, text.failedMine],
  ] as const)('explains an empty %s tab', (tab, extra, message) => {
    renderPanel(tab, [], extra);

    expect(screen.getByRole('status')).toHaveTextContent(message);
  });

  it('marks the plots of the user on their cards', () => {
    renderPanel('mine', [{ ...PLOT, properties: { ...PLOT.properties, ownedByMe: true } }]);

    expect(screen.getByRole('button', { name: /150\.000,00/ })).toHaveTextContent(
      messages.legend.mine,
    );
  });

  it('says nothing above a tab of the user that has plots', () => {
    renderPanel('reserved', [PLOT]);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: text.list })).toBeInTheDocument();
  });
});

describe('MapLegend', () => {
  it('names every status colour and the dashed outline of the plots of the user', () => {
    render(<MapLegend />);
    const legend = screen.getByRole('list', { name: messages.legend.label });

    for (const label of [...Object.values(messages.popup.status), messages.legend.mine]) {
      expect(legend).toHaveTextContent(label);
    }
  });
});
