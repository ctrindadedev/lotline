import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import type { PlotsSummary } from '../types';
import { AreaSummary } from './AreaSummary';

const text = messages.summary;

const SUMMARY: PlotsSummary = {
  available: 4,
  reserved: 1,
  sold: 2,
  totalAreaSquareMeters: 685000,
  minPricePerSquareMeter: 1.05,
  medianPricePerSquareMeter: 19.76,
  maxPricePerSquareMeter: 41.46,
};

describe('AreaSummary', () => {
  it('shows the counts per status, the total area and the price per m² spread', () => {
    render(<AreaSummary summary={SUMMARY} />);
    const summary = screen.getByRole('region', { name: text.label });

    expect(summary).toHaveTextContent(text.statuses(4, 1, 2));
    expect(summary).toHaveTextContent(`${text.totalArea}68,50 ha`);
    expect(summary).toHaveTextContent('19,76/m²');
    expect(summary).toHaveTextContent(`${text.min} R$`);
    expect(summary).toHaveTextContent('1,05/m²');
    expect(summary).toHaveTextContent('41,46/m²');
  });

  it('leaves the prices out when there are no plots', () => {
    render(
      <AreaSummary
        summary={{
          ...SUMMARY,
          available: 0,
          reserved: 0,
          sold: 0,
          totalAreaSquareMeters: 0,
          minPricePerSquareMeter: null,
          medianPricePerSquareMeter: null,
          maxPricePerSquareMeter: null,
        }}
      />,
    );
    const summary = screen.getByRole('region', { name: text.label });

    expect(summary).toHaveTextContent(text.statuses(0, 0, 0));
    expect(summary).not.toHaveTextContent(text.pricePerSquareMeter);
    expect(summary).not.toHaveTextContent(text.median);
  });
});
