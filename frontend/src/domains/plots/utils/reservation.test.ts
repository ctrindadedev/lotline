import { describe, expect, it } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import { ApiError } from '../../../shared/lib/http';
import type { PlotProperties } from '../types';
import { describeReservationError, describeStatus, reservationActions } from './reservation';

const PLOT: PlotProperties = {
  price: 1000,
  description: 'A plot',
  createdAt: '2026-10-07T12:00:00Z',
  status: 'AVAILABLE',
  reservable: true,
  ownedByMe: false,
  reservedByMe: false,
};

describe('reservationActions', () => {
  it.each([
    ['anyone else on an available plot', {}, ['reserve']],
    ['the seller on an available plot', { ownedByMe: true }, []],
    ['anyone on a plot without a seller', { reservable: false }, []],
    ['the seller on a reserved plot', { status: 'RESERVED', ownedByMe: true }, ['sell', 'release']],
    ['the buyer on a reserved plot', { status: 'RESERVED', reservedByMe: true }, ['cancel']],
    ['anyone else on a reserved plot', { status: 'RESERVED' }, []],
    ['the seller on a sold plot', { status: 'SOLD', ownedByMe: true }, []],
    ['the buyer on a sold plot', { status: 'SOLD', reservedByMe: true }, []],
  ] as const)('offers %s: %j → %j', (_, changes, expected) => {
    expect(reservationActions({ ...PLOT, ...changes })).toEqual(expected);
  });
});

describe('describeStatus', () => {
  it('names the status, or the user asking when they are the buyer', () => {
    expect(describeStatus(PLOT)).toBe(messages.popup.status.AVAILABLE);
    expect(describeStatus({ ...PLOT, status: 'SOLD' })).toBe(messages.popup.status.SOLD);
    expect(describeStatus({ ...PLOT, status: 'RESERVED', reservedByMe: true })).toBe(
      messages.popup.reservedByYou,
    );
    expect(describeStatus({ ...PLOT, status: 'SOLD', reservedByMe: true })).toBe(
      messages.popup.boughtByYou,
    );
  });
});

describe('describeReservationError', () => {
  const errors = messages.reservation.errors;

  it.each([
    [401, errors.sessionExpired],
    [403, errors.notAllowed],
    [404, errors.gone],
    [409, errors.changed],
    [500, errors.server],
  ])('explains a %d', (status, message) => {
    expect(describeReservationError(new ApiError(status, 'x', 'x'))).toBe(message);
  });

  it('explains a network failure', () => {
    expect(describeReservationError(new TypeError('Failed to fetch'))).toBe(errors.network);
  });
});
