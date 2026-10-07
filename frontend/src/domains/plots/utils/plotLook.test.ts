import { describe, expect, it } from 'vitest';
import type { PlotProperties } from '../types';
import { plotLook, STATUS_COLORS } from './plotLook';

const PLOT: PlotProperties = {
  price: 1000,
  description: 'A plot',
  createdAt: '2026-10-07T12:00:00Z',
  status: 'AVAILABLE',
  reservable: true,
  ownedByMe: false,
  reservedByMe: false,
};

describe('plotLook', () => {
  it('colours a plot by its status', () => {
    expect(plotLook({ ...PLOT, status: 'RESERVED' }, false)).toEqual({
      ...STATUS_COLORS.RESERVED,
      width: 2,
      dashed: false,
    });
  });

  it('dashes the plots of the user and outlines the selected one', () => {
    expect(plotLook({ ...PLOT, ownedByMe: true }, false)).toMatchObject({ dashed: true, width: 2 });
    expect(plotLook({ ...PLOT, ownedByMe: true }, true)).toMatchObject({ dashed: false, width: 4 });
  });
});
