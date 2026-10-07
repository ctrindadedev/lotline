import { describe, expect, it } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import { ApiError } from '../../../shared/lib/http';
import {
  describeAuthError,
  EMPTY_ACCOUNT,
  resolverFor,
  toCredentials,
  toNewAccount,
  validateAccount,
  validateCredentials,
} from './authForm';

const errors = messages.auth.errors;
const options = { fields: {}, shouldUseNativeValidation: false };

describe('validateCredentials', () => {
  it('needs an email and a password', () => {
    expect(validateCredentials({ email: ' ana@example.com ', password: 'x' })).toEqual({});
    expect(validateCredentials({ email: 'ana', password: '   ' })).toEqual({
      email: errors.emailInvalid,
      password: errors.passwordRequired,
    });
  });
});

describe('validateAccount', () => {
  it('mirrors the API rules', () => {
    expect(
      validateAccount({ name: 'Ana', email: 'ana@example.com', password: '12345678' }),
    ).toEqual({});
    expect(validateAccount(EMPTY_ACCOUNT)).toEqual({
      name: errors.nameRequired,
      email: errors.emailInvalid,
      password: errors.passwordTooShort,
    });
    expect(
      validateAccount({
        name: 'x'.repeat(101),
        email: 'ana@example.com',
        password: 'é'.repeat(40),
      }),
    ).toEqual({ name: errors.nameTooLong, password: errors.passwordTooLong });
  });
});

describe('resolverFor', () => {
  it('passes valid values and reports invalid fields', async () => {
    const resolver = resolverFor(validateCredentials);
    const valid = { email: 'ana@example.com', password: 'x' };

    expect(await resolver(valid, undefined, options)).toEqual({ values: valid, errors: {} });
    expect(await resolver({ email: '', password: 'x' }, undefined, options)).toEqual({
      values: {},
      errors: { email: { type: 'validate', message: errors.emailInvalid } },
    });
  });
});

describe('form values', () => {
  it('trim everything but the password', () => {
    expect(toCredentials({ email: ' a@b.co ', password: ' p ' })).toEqual({
      email: 'a@b.co',
      password: ' p ',
    });
    expect(toNewAccount({ name: ' Ana ', email: ' a@b.co ', password: ' p ' })).toEqual({
      name: 'Ana',
      email: 'a@b.co',
      password: ' p ',
    });
  });
});

describe('describeAuthError', () => {
  it('maps each API answer to Portuguese', () => {
    expect(describeAuthError(null)).toEqual({ message: null, fieldErrors: {} });
    expect(describeAuthError(new TypeError('Failed to fetch')).message).toBe(errors.network);
    expect(describeAuthError(new ApiError(401, 'Unauthorized', 'x')).message).toBe(
      errors.badCredentials,
    );
    expect(describeAuthError(new ApiError(409, 'Conflict', 'x'))).toEqual({
      message: null,
      fieldErrors: { email: errors.emailTaken },
    });
    expect(
      describeAuthError(
        new ApiError(400, 'Bad Request', 'x', [
          { field: 'password', message: 'size must be between 8 and 2147483647' },
        ]),
      ),
    ).toEqual({ message: null, fieldErrors: { password: errors.passwordTooShort } });
    expect(describeAuthError(new ApiError(400, 'Bad Request', 'x')).message).toBe(errors.server);
    expect(describeAuthError(new ApiError(503, 'Unavailable', 'x')).message).toBe(errors.server);
  });
});
