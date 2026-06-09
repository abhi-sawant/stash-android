import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, BackupData, Bookmark, Collection } from './types';

const KEYS = {
  BOOKMARKS: 'pb_bookmarks',
  COLLECTIONS: 'pb_collections',
  SETTINGS: 'pb_settings',
};

export const defaultSettings: AppSettings = {
  themePreference: 'system',
};

async function read<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ── Bookmarks ──────────────────────────────────────────────────────────────
export function loadBookmarks(): Promise<Bookmark[]> {
  return read<Bookmark[]>(KEYS.BOOKMARKS, []);
}

export function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  return AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
}

// ── Collections ────────────────────────────────────────────────────────────
export function loadCollections(): Promise<Collection[]> {
  return read<Collection[]>(KEYS.COLLECTIONS, []);
}

export function saveCollections(collections: Collection[]): Promise<void> {
  return AsyncStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(collections));
}

// ── Settings ───────────────────────────────────────────────────────────────
export async function loadSettings(): Promise<AppSettings> {
  return { ...defaultSettings, ...(await read<Partial<AppSettings>>(KEYS.SETTINGS, {})) };
}

export function saveSettings(settings: AppSettings): Promise<void> {
  return AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ── Export all data ────────────────────────────────────────────────────────
export async function exportAllData(): Promise<BackupData> {
  const [bookmarks, collections, settings] = await Promise.all([
    loadBookmarks(),
    loadCollections(),
    loadSettings(),
  ]);
  return { bookmarks, collections, settings, exportedAt: Date.now(), version: 1 };
}

// ── Import all data ────────────────────────────────────────────────────────
export async function importAllData(data: BackupData): Promise<void> {
  if (!data || typeof data !== 'object') throw new Error('Invalid backup data');
  if (data.version !== 1) throw new Error('Unsupported backup version');
  await Promise.all([
    saveBookmarks(data.bookmarks ?? []),
    saveCollections(data.collections ?? []),
    saveSettings({ ...defaultSettings, ...(data.settings ?? {}) }),
  ]);
}

// ── Clear all ──────────────────────────────────────────────────────────────
export function clearAllData(): Promise<void> {
  return AsyncStorage.multiRemove([KEYS.BOOKMARKS, KEYS.COLLECTIONS, KEYS.SETTINGS]).then(() => {});
}
