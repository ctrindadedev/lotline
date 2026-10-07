import Feature from 'ol/Feature';
import { describe, expect, it } from 'vitest';
import { SELECTED } from '../../../shared/map/useSelectedFeature';
import { STATUS_COLORS } from './plotLook';
import { plotStyleFor } from './plotStyle';

function feature(id: string, properties: object) {
  const created = new Feature({ status: 'AVAILABLE', ownedByMe: false, ...properties });
  created.setId(id);
  return created;
}

describe('plotStyleFor', () => {
  const prices = { byId: new Map([['cheap', 1]]), range: { min: 1, max: 100 } };

  it('colours by status, with a thick outline on the selected plot', () => {
    const style = plotStyleFor('status', prices);

    expect(
      style(feature('a', { status: 'SOLD' }))
        .getFill()
        ?.getColor(),
    ).toBe(STATUS_COLORS.SOLD.fill);
    expect(
      style(feature('a', { [SELECTED]: true }))
        .getStroke()
        ?.getWidth(),
    ).toBe(4);
  });

  it('colours by price per m², looked up by plot id', () => {
    const style = plotStyleFor('price', prices);

    expect(style(feature('cheap', {})).getFill()?.getColor()).toBe('rgb(255 255 178 / 70%)');
    expect(style(feature('unknown', {})).getFill()?.getColor()).toBe('rgb(175 184 193 / 70%)');
  });
});
