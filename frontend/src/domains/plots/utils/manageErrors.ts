import { messages } from '../../../shared/i18n/messages';
import { ApiError, isSessionLost } from '../../../shared/lib/http';

const text = messages.manage.errors;

/** Portuguese text for a failed edit or deletion of a plot. */
export function describeManageError(error: Error | null): string | null {
  if (!error) {
    return null;
  }
  if (!(error instanceof ApiError)) {
    return text.network;
  }
  if (isSessionLost(error)) {
    return text.sessionExpired;
  }
  switch (error.status) {
    case 403:
      return text.notOwner;
    case 404:
      return text.gone;
    case 409:
      return text.frozen;
    default:
      return text.server;
  }
}
