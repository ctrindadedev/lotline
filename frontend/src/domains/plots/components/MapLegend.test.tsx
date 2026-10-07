import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import type { ColourBy, PriceScope } from '../utils/priceColours';
import { MapLegend } from './MapLegend';

const text = messages.legend;

function renderLegend(
  colourBy: ColourBy,
  priceRange: { min: number; max: number } | null = null,
  priceScope: PriceScope = 'view',
) {
  const onColourBy = vi.fn<(mode: ColourBy) => void>();
  render(
    <MapLegend
      colourBy={colourBy}
      onColourBy={onColourBy}
      priceRange={priceRange}
      priceScope={priceScope}
    />,
  );
  return { onColourBy, legend: screen.getByRole('list', { name: text.label }) };
}

describe('MapLegend', () => {
  it('names every status colour and the dashed outline of the plots of the user', () => {
    const { legend } = renderLegend('status');

    for (const label of [...Object.values(messages.popup.status), text.mine]) {
      expect(legend).toHaveTextContent(label);
    }
  });

  it('switches what the map is coloured by', async () => {
    const { onColourBy } = renderLegend('status');

    await userEvent.click(screen.getByRole('button', { name: text.modes.price }));
    await userEvent.click(screen.getByRole('button', { name: text.modes.status }));

    expect(onColourBy.mock.calls).toEqual([['price']]);
  });

  it('shows the price scale of the plots in view, or says there are none', () => {
    const { legend } = renderLegend('price', { min: 0.5, max: 32.92 });

    expect(legend).toHaveTextContent('0,50/m²');
    expect(legend).toHaveTextContent('32,92/m²');
    expect(legend).toHaveTextContent(text.logScale.view);
    expect(legend).not.toHaveTextContent(messages.popup.status.SOLD);
  });

  it.each([
    ['view', text.noPrices.view],
    ['search', text.noPrices.search],
    ['zoomedOut', text.noPrices.zoomedOut],
  ] as const)('says why there is no price to scale (%s)', (scope, message) => {
    const { legend } = renderLegend('price', null, scope);

    expect(legend).toHaveTextContent(message);
  });

  it('asks to zoom in even with a range left from before', () => {
    const { legend } = renderLegend('price', { min: 1, max: 2 }, 'zoomedOut');

    expect(legend).toHaveTextContent(text.noPrices.zoomedOut);
  });

  it('says the scale describes the search results during a search', () => {
    const { legend } = renderLegend('price', { min: 1, max: 2 }, 'search');

    expect(legend).toHaveTextContent(text.logScale.search);
  });
});
