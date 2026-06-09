import { getAuthToken } from './auth-storage';
import type { StoredUser } from './types';

export const API_BASE_URL = 'https://api.stash.slowatcoding.com';

/** A local image file to upload (React Native FormData file descriptor). */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

// ─── Generic request helper ───────────────────────────────────────────────

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData — RN adds it with the multipart boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed with status ${response.status}`);
  }

  return data as T;
}

// ─── API methods ──────────────────────────────────────────────────────────

export const api = {
  auth: {
    /** Register a new account. Sends an OTP to the email. */
    register: (email: string, password: string) =>
      request<{ message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    /** Log in with email + password. Sends an OTP to the email. */
    login: (email: string, password: string) =>
      request<{ message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    /** Verify the OTP. Returns { token, user } on success. */
    verifyOtp: (email: string, otp: string) =>
      request<{ token: string; user: StoredUser }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),

    /** Resend a new OTP to the given email. */
    resendOtp: (email: string) =>
      request<{ message: string }>('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    /** Sends a password reset OTP to the email (if the account exists). */
    forgotPassword: (email: string) =>
      request<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    /** Verifies the reset OTP and sets a new password. */
    resetPassword: (email: string, otp: string, password: string) =>
      request<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, password }),
      }),

    /** Returns the current user from the JWT. */
    me: () => request<{ user: StoredUser }>('/api/auth/me'),
  },

  backup: {
    /** Upload a full data backup. */
    upload: (data: object) =>
      request<{ backup_id: number; created_at: string; size: number }>('/api/backup/upload', {
        method: 'POST',
        body: JSON.stringify({ data }),
      }),

    /** Get the most recent backup. Throws with "No backup found" if none exist. */
    latest: () =>
      request<{ id: number; data: Record<string, unknown>; size: number; created_at: string }>(
        '/api/backup/latest',
      ),

    /** List all backup metadata (no data payload). */
    list: () => request<{ backups: { id: number; size: number; created_at: string }[] }>('/api/backup/list'),
  },

  thumbnails: {
    /** Fetch all thumbnail URLs for the current user. */
    get: () =>
      request<{ thumbnails: { bookmark_id: string; image_url: string; updated_at: string }[] }>(
        '/api/thumbnails',
      ),

    /** Upload a single local image file for a bookmark. Returns the public server URL. */
    upload: (bookmarkId: string, file: UploadFile) => {
      const form = new FormData();
      form.append('bookmark_id', bookmarkId);
      // React Native FormData accepts a { uri, name, type } file descriptor.
      form.append('image', file as unknown as Blob);
      return request<{ url: string }>('/api/thumbnails/upload', { method: 'POST', body: form });
    },

    /** Tell the server to download an external image URL and store it as a thumbnail. */
    uploadByUrl: (bookmarkId: string, imageUrl: string) => {
      const form = new FormData();
      form.append('bookmark_id', bookmarkId);
      form.append('image_url', imageUrl);
      return request<{ url: string }>('/api/thumbnails/upload', { method: 'POST', body: form });
    },

    /** Delete thumbnail files and records by bookmark ID. */
    delete: (bookmark_ids: string[]) =>
      request<{ deleted: number }>('/api/thumbnails/delete', {
        method: 'DELETE',
        body: JSON.stringify({ bookmark_ids }),
      }),
  },
};
