import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import { messages } from '../../../shared/i18n/messages';
import { ApiError } from '../../../shared/lib/http';
import type { Credentials, NewAccount } from '../types';

const text = messages.auth.errors;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD_BYTES = 72;
const MAX_NAME = 100;
const MAX_EMAIL = 255;

export const EMPTY_CREDENTIALS: Credentials = { email: '', password: '' };
export const EMPTY_ACCOUNT: NewAccount = { name: '', email: '', password: '' };

type Errors<T> = Partial<Record<keyof T, string>>;

export function validateCredentials({ email, password }: Credentials): Errors<Credentials> {
  const errors: Errors<Credentials> = {};
  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = text.emailInvalid;
  }
  if (!password.trim()) {
    errors.password = text.passwordRequired;
  }
  return errors;
}

/**
 * Mirrors `RegisterRequest`: a name up to 100 characters, a valid email up to 255, and a
 * password that is not blank, of 8 characters to 72 bytes (BCrypt ignores the rest).
 */
export function validateAccount({ name, email, password }: NewAccount): Errors<NewAccount> {
  const errors: Errors<NewAccount> = {};
  if (!name.trim()) {
    errors.name = text.nameRequired;
  } else if (name.trim().length > MAX_NAME) {
    errors.name = text.nameTooLong;
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = text.emailInvalid;
  } else if (email.trim().length > MAX_EMAIL) {
    errors.email = text.emailTooLong;
  }
  if (!password.trim()) {
    errors.password = text.passwordRequired;
  } else if (password.length < MIN_PASSWORD) {
    errors.password = text.passwordTooShort;
  } else if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    errors.password = text.passwordTooLong;
  }
  return errors;
}

export function resolverFor<T extends FieldValues>(
  validate: (values: T) => Errors<T>,
): Resolver<T> {
  return (values) => {
    const errors = validate(values);
    const fields = Object.keys(errors) as (keyof T & string)[];
    if (fields.length === 0) {
      return { values, errors: {} };
    }
    const fieldErrors: Record<string, { type: string; message?: string }> = {};
    for (const field of fields) {
      fieldErrors[field] = { type: 'validate', message: errors[field] };
    }
    return { values: {}, errors: fieldErrors as FieldErrors<T> };
  };
}

export function toCredentials({ email, password }: Credentials): Credentials {
  return { email: email.trim(), password };
}

export function toNewAccount({ name, email, password }: NewAccount): NewAccount {
  return { name: name.trim(), email: email.trim(), password };
}

export interface AuthErrorView {
  message: string | null;
  fieldErrors: Errors<NewAccount>;
}

const FIELD_MESSAGES: Record<keyof NewAccount, string> = {
  name: text.nameRequired,
  email: text.emailInvalid,
  password: text.passwordTooShort,
};

/**
 * Portuguese text for a failed login. Always the same for a malformed form, a rejected field or
 * wrong credentials: the page never says which of the two was wrong.
 */
export function describeLoginError(error: Error | null): string | null {
  if (!error) {
    return null;
  }
  if (!(error instanceof ApiError)) {
    return text.network;
  }
  return error.status === 400 || error.status === 401 ? text.badCredentials : text.server;
}

/** Portuguese text for an API error on the registration form. */
export function describeAuthError(error: Error | null): AuthErrorView {
  if (!error) {
    return { message: null, fieldErrors: {} };
  }
  if (!(error instanceof ApiError)) {
    return { message: text.network, fieldErrors: {} };
  }
  switch (error.status) {
    case 401:
      return { message: text.badCredentials, fieldErrors: {} };
    case 409:
      // Generic on purpose: "this email has an account" would tell anyone who has one.
      return { message: text.registrationFailed, fieldErrors: {} };
    case 400: {
      const fieldErrors: Errors<NewAccount> = {};
      for (const { field } of error.errors) {
        if (field in FIELD_MESSAGES) {
          fieldErrors[field as keyof NewAccount] = FIELD_MESSAGES[field as keyof NewAccount];
        }
      }
      return { message: Object.keys(fieldErrors).length ? null : text.server, fieldErrors };
    }
    default:
      return { message: text.server, fieldErrors: {} };
  }
}
