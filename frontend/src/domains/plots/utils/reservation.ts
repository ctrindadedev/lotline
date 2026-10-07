import { messages } from '../../../shared/i18n/messages';
import { ApiError } from '../../../shared/lib/http';
import type { PlotProperties } from '../types';

/** `cancel` is the buyer dropping their reservation, `release` the seller doing it. */
export type ReservationAction = 'reserve' | 'cancel' | 'release' | 'sell';

/** What the user asking can do with a plot's reservation; visitors are offered `reserve` too. */
export function reservationActions(plot: PlotProperties): ReservationAction[] {
  if (plot.status === 'AVAILABLE') {
    return plot.reservable && !plot.ownedByMe ? ['reserve'] : [];
  }
  if (plot.status === 'RESERVED') {
    if (plot.ownedByMe) {
      return ['sell', 'release'];
    }
    return plot.reservedByMe ? ['cancel'] : [];
  }
  return [];
}

/** The line under the price: the status, from the point of view of the user asking. */
export function describeStatus(plot: PlotProperties): string {
  const text = messages.popup;
  if (plot.reservedByMe) {
    return plot.status === 'SOLD' ? text.boughtByYou : text.reservedByYou;
  }
  return text.status[plot.status];
}

const errors = messages.reservation.errors;

export function describeReservationError(error: Error): string {
  if (!(error instanceof ApiError)) {
    return errors.network;
  }
  switch (error.status) {
    case 401:
      return errors.sessionExpired;
    case 403:
      return errors.notAllowed;
    case 404:
      return errors.gone;
    case 409:
      return errors.changed;
    default:
      return errors.server;
  }
}
