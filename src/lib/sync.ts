import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { loadBookmarks, loadCollections, loadSettings } from './storage';
import type { AppSettings, Bookmark, Collection } from './types';

// ── Thumbnail helpers ────────────────────────────────────────────────────────

/** Returns a copy of the bookmark list with imageUri removed. */
function stripImages(bookmarks: Bookmark[]): Omit<Bookmark, 'imageUri'>[] {
  return bookmarks.map(({ imageUri: _imageUri, ...rest }) => rest);
}

/** Merges a bookmark_id → image_url map back into a bookmark list. */
export function rehydrateThumbnails(bookmarks: Bookmark[], thumbMap: Map<string, string>): Bookmark[] {
  if (thumbMap.size === 0) return bookmarks;
  return bookmarks.map((b) => {
    const imageUrl = thumbMap.get(b.id);
    return imageUrl ? { ...b, imageUri: imageUrl } : b;
  });
}

/** Fetches all thumbnails for the current user and returns a bookmark_id → URL map. */
export async function fetchThumbnails(): Promise<Map<string, string>> {
  const { thumbnails } = await api.thumbnails.get();
  return new Map(thumbnails.map((t) => [t.bookmark_id, t.image_url]));
}

const OWN_HOST = 'api.stash.slowatcoding.com';

/**
 * Uploads images for every bookmark whose imageUri is a local file (not yet on
 * the server). Returns a map of bookmark_id → server URL for those uploaded, so
 * the caller can repoint those bookmarks at the permanent server URL.
 */
export async function syncThumbnails(bookmarks: Bookmark[]): Promise<Map<string, string>> {
  const updates = new Map<string, string>();
  const toUpload = bookmarks.filter((b) => {
    if (!b.imageUri) return false;
    // Local file picked/captured on device, not yet uploaded.
    if (b.imageUri.startsWith('file://') || b.imageUri.startsWith('data:')) return true;
    // External URL not yet on our server — have the server download it.
    return /^https?:\/\//i.test(b.imageUri) && !b.imageUri.includes(OWN_HOST);
  });

  await Promise.allSettled(
    toUpload.map(async (b) => {
      try {
        let url: string;
        const imageUri = b.imageUri!;
        if (imageUri.startsWith('file://') || imageUri.startsWith('data:')) {
          ({ url } = await api.thumbnails.upload(b.id, {
            uri: imageUri,
            name: `${b.id}.jpg`,
            type: 'image/jpeg',
          }));
        } else {
          ({ url } = await api.thumbnails.uploadByUrl(b.id, imageUri));
        }
        updates.set(b.id, url);
      } catch (e) {
        console.error('[thumbnail upload failed]', b.id, e);
      }
    }),
  );

  return updates;
}

export interface SyncData {
  bookmarks: Bookmark[];
  collections: Collection[];
  settings: AppSettings;
}

export interface RemoteData {
  id: number;
  data: Record<string, unknown>;
  size: number;
  created_at: string;
}

const LAST_SYNCED_BACKUP_ID_KEY = 'stash_last_synced_backup_id';
const LAST_SYNC_TIME_KEY = 'stash_last_sync_time';

// ── Merge ────────────────────────────────────────────────────────────────────

/**
 * Merges two data snapshots into one:
 * - Bookmarks: union by ID, keep the entry with the higher `updatedAt`
 * - Collections: union by ID, local takes precedence on conflict (no `updatedAt`)
 * - Settings: always kept from `local` (theme etc. stay per-device)
 */
export function mergeData(local: SyncData, remote: SyncData): SyncData {
  const bookmarkMap = new Map<string, Bookmark>();
  for (const b of [...remote.bookmarks, ...local.bookmarks]) {
    const cur = bookmarkMap.get(b.id);
    if (!cur || b.updatedAt > cur.updatedAt) {
      // imageUri is stripped from server backups to keep the payload small.
      // Preserve it from whichever version has it so a merge never silently
      // drops a local cover image or a server thumbnail URL.
      const imageUri = b.imageUri ?? cur?.imageUri;
      bookmarkMap.set(b.id, imageUri !== undefined ? { ...b, imageUri } : b);
    }
  }

  const collectionMap = new Map<string, Collection>();
  // Remote first so local overwrites on ID conflict
  for (const c of [...remote.collections, ...local.collections]) {
    if (!collectionMap.has(c.id)) collectionMap.set(c.id, c);
  }

  return {
    bookmarks: Array.from(bookmarkMap.values()).sort((a, b) => b.createdAt - a.createdAt),
    collections: Array.from(collectionMap.values()).sort((a, b) => a.createdAt - b.createdAt),
    settings: local.settings,
  };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function getLastSyncedBackupId(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(LAST_SYNCED_BACKUP_ID_KEY);
  return raw ? parseInt(raw, 10) : null;
}

function setLastSyncedBackupId(id: number): Promise<void> {
  return AsyncStorage.setItem(LAST_SYNCED_BACKUP_ID_KEY, id.toString());
}

/** Fetches the latest remote backup, or null if none exists yet. */
export async function fetchLatestBackup(): Promise<RemoteData | null> {
  try {
    return (await api.backup.latest()) as RemoteData;
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'No backup found') return null;
    throw e;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns the timestamp (ms) of the last successful upload, or null. */
export async function getLastSyncTime(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(LAST_SYNC_TIME_KEY);
  return raw ? parseInt(raw, 10) : null;
}

/** Uploads a data snapshot to the server and records the sync time. imageUri is
 *  stripped from bookmarks before upload — thumbnails are synced separately so
 *  they don't count against the backup size limit. */
export async function uploadData(data: SyncData): Promise<void> {
  const payload = { ...data, bookmarks: stripImages(data.bookmarks), exportedAt: Date.now(), version: 1 };
  await api.backup.upload(payload);
  await AsyncStorage.setItem(LAST_SYNC_TIME_KEY, Date.now().toString());
}

/** Reads current data from storage and uploads it. */
export async function uploadBackup(): Promise<void> {
  const [bookmarks, collections, settings] = await Promise.all([
    loadBookmarks(),
    loadCollections(),
    loadSettings(),
  ]);
  await uploadData({ bookmarks, collections, settings });
}

/**
 * Checks the server for a backup we haven't seen yet, merges it with `local`,
 * and returns the merged result. Returns `null` when already up to date.
 */
export async function fetchAndMerge(
  local: SyncData,
): Promise<{ merged: SyncData; backupId: number } | null> {
  const remote = await fetchLatestBackup();
  if (!remote) return null;

  const lastSyncedId = await getLastSyncedBackupId();
  if (remote.id === lastSyncedId) return null; // already up to date

  const remoteData: SyncData = {
    bookmarks: Array.isArray(remote.data.bookmarks) ? (remote.data.bookmarks as Bookmark[]) : [],
    collections: Array.isArray(remote.data.collections) ? (remote.data.collections as Collection[]) : [],
    settings: (remote.data.settings as AppSettings | undefined) ?? local.settings,
  };

  const merged = mergeData(local, remoteData);

  // Rehydrate imageUri from the thumbnails table. Old backups may still carry
  // imageUri inline — the server thumbnail takes precedence for those that exist.
  try {
    const thumbMap = await fetchThumbnails();
    merged.bookmarks = rehydrateThumbnails(merged.bookmarks, thumbMap);
  } catch {
    // If the fetch fails, keep whatever imageUri was in the backup
  }

  await setLastSyncedBackupId(remote.id);
  return { merged, backupId: remote.id };
}
