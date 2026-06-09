import * as SecureStore from 'expo-secure-store';
import type { StoredUser } from './types';

const TOKEN_KEY = 'stash_auth_token';
const USER_KEY = 'stash_auth_user';

// SecureStore is async, but `api.ts` needs the token synchronously on every
// request. We keep an in-memory cache (hydrated once at startup) and treat
// SecureStore purely as the persistent backing store.
let cachedToken: string | null = null;
let cachedUser: StoredUser | null = null;

/** Hydrate the in-memory cache from SecureStore. Call once on app start. */
export async function hydrateAuthStorage(): Promise<{ token: string | null; user: StoredUser | null }> {
  cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  const rawUser = await SecureStore.getItemAsync(USER_KEY);
  try {
    cachedUser = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
  } catch {
    cachedUser = null;
  }
  return { token: cachedToken, user: cachedUser };
}

export function saveAuthToken(token: string): void {
  cachedToken = token;
  void SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return cachedToken;
}

export function clearAuthToken(): void {
  cachedToken = null;
  void SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function saveAuthUser(user: StoredUser): void {
  cachedUser = user;
  void SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): StoredUser | null {
  return cachedUser;
}

export function clearAuthUser(): void {
  cachedUser = null;
  void SecureStore.deleteItemAsync(USER_KEY);
}
