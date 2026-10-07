import { describe, expect, it } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import { ApiError } from '../../../shared/lib/http';
import {
  describeAuthError,
  describeLoginError,
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
      password: errors.passwordRequired,
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

describe('validateAccount at the limits of the API', () => {
  const valid = { name: 'Ana', email: 'ana@example.com', password: '12345678' };
  const emailOf = (length: number) => `${'a'.repeat(length - '@example.com'.length)}@example.com`;

  it.each([
    ['a blank password', { password: ' '.repeat(8) }, { password: errors.passwordRequired }],
    ['7 characters', { password: '1234567' }, { password: errors.passwordTooShort }],
    ['8 characters', { password: '12345678' }, {}],
    ['72 bytes', { password: 'é'.repeat(36) }, {}],
    ['73 bytes', { password: 'é'.repeat(36) + 'a' }, { password: errors.passwordTooLong }],
    ['a 100-character name', { name: 'x'.repeat(100) }, {}],
    ['a 101-character name', { name: 'x'.repeat(101) }, { name: errors.nameTooLong }],
    ['a 255-character email', { email: emailOf(255) }, {}],
    ['a 256-character email', { email: emailOf(256) }, { email: errors.emailTooLong }],
  ])('%s', (_, changes, expected) => {
    expect(validateAccount({ ...valid, ...changes })).toEqual(expected);
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

describe('describeLoginError', () => {
  it('says the same for a rejected field and for wrong credentials', () => {
    expect(describeLoginError(null)).toBeNull();
    expect(describeLoginError(new ApiError(401, 'Unauthorized', 'x'))).toBe(errors.badCredentials);
    expect(describeLoginError(new ApiError(400, 'Bad Request', 'x'))).toBe(errors.badCredentials);
    expect(describeLoginError(new ApiError(503, 'Unavailable', 'x'))).toBe(errors.server);
    expect(describeLoginError(new TypeError('Failed to fetch'))).toBe(errors.network);
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
      message: errors.registrationFailed,
      fieldErrors: {},
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
