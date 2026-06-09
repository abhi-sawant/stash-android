export interface Bookmark {
  id: string;
  url: string;
  title: string;
  subtitle: string;
  imageUri?: string;
  faviconUri?: string;
  collectionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
}

export interface AppSettings {
  themePreference: 'light' | 'dark' | 'system';
}

export interface UrlMetadata {
  title: string;
  description: string;
  imageUrl?: string;
  faviconUrl?: string;
}

export interface StoredUser {
  id: number;
  email: string;
}

/** Shape of the JSON payload stored in backups and exported files. */
export interface BackupData {
  bookmarks: Bookmark[];
  collections: Collection[];
  settings: AppSettings;
  exportedAt: number;
  version: number;
}
