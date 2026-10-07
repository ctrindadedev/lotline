import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import type { ColourBy } from '../utils/priceColours';
import { MapLegend } from './MapLegend';

const text = messages.legend;

function renderLegend(colourBy: ColourBy, priceRange: { min: number; max: number } | null = null) {
  const onColourBy = vi.fn<(mode: ColourBy) => void>();
  render(<MapLegend colourBy={colourBy} onColourBy={onColourBy} priceRange={priceRange} />);
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
    expect(legend).toHaveTextContent(text.logScale);
    expect(legend).not.toHaveTextContent(messages.popup.status.SOLD);
  });

  it('says when there is no price to scale', () => {
    const { legend } = renderLegend('price');

    expect(legend).toHaveTextContent(text.noPrices);
  });
});
