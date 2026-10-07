import { describe, expect, it } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import { ApiError } from '../../../shared/lib/http';
import { describeManageError } from './manageErrors';

const errors = messages.manage.errors;

describe('describeManageError', () => {
  it.each([
    [401, errors.sessionExpired],
    [403, errors.notOwner],
    [404, errors.gone],
    [409, errors.frozen],
    [500, errors.server],
  ])('explains a %d', (status, message) => {
    expect(describeManageError(new ApiError(status, 'x', 'x'))).toBe(message);
  });

  it('handles no error and network failures', () => {
    expect(describeManageError(null)).toBeNull();
    expect(describeManageError(new TypeError('Failed to fetch'))).toBe(errors.network);
  });

  it('treats a refused CSRF token as an ended session', () => {
    expect(
      describeManageError(new ApiError(403, 'Forbidden', 'Missing or invalid CSRF token')),
    ).toBe(errors.sessionExpired);
  });
});
