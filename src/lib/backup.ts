import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportAllData, importAllData } from './storage';
import type { BackupData } from './types';

function getBackupFilename() {
  return `stash-backup-${new Date().toISOString().split('T')[0]}.json`;
}

/**
 * Writes the full data backup to a JSON file in the cache directory and opens
 * the native share sheet so the user can save / send it.
 */
export async function downloadBackup(): Promise<void> {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);

  const file = new File(Paths.cache, getBackupFilename());
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Stash backup',
      UTI: 'public.json',
    });
  }
}

/**
 * Opens a file picker and restores the chosen backup file into local storage.
 * Resolves to `true` if a file was restored, `false` if the user cancelled.
 */
export async function restoreFromBackup(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) return false;

  try {
    const file = new File(result.assets[0].uri);
    const text = await file.text();
    const data = JSON.parse(text) as BackupData;
    await importAllData(data);
    return true;
  } catch {
    throw new Error('Invalid or corrupted backup file');
  }
}
