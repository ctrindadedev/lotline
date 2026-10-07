import { ApiError, csrfToken, getJson, postJson } from '../../../shared/lib/http';
import type { Credentials, NewAccount, User } from '../types';

/** The logged-in user, or null for a visitor. Also gives the browser the CSRF cookie. */
export async function getCurrentUser(signal?: AbortSignal): Promise<User | null> {
  try {
    return await getJson<User>('/auth/me', undefined, signal);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

/** A write needs the CSRF cookie, which the first "me" request writes; it may not have run yet. */
async function ensureCsrfToken() {
  if (!csrfToken()) {
    await getCurrentUser();
  }
}

export async function logIn(credentials: Credentials): Promise<User> {
  await ensureCsrfToken();
  return postJson('/auth/login', credentials);
}

export async function register(account: NewAccount): Promise<User> {
  await ensureCsrfToken();
  return postJson('/auth/register', account);
}

export function logOut(): Promise<void> {
  return postJson('/auth/logout');
}
