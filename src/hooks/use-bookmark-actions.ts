import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useConfirm } from '@/components/confirm-dialog';
import { useBookmarks } from '@/lib/context';
import { toast } from '@/lib/toast';
import { normalizeUrl } from '@/lib/utils';
import type { Bookmark } from '@/lib/types';

export function useBookmarkActions() {
  const router = useRouter();
  const confirm = useConfirm();
  const { deleteBookmark } = useBookmarks();

  const open = async (b: Bookmark) => {
    try {
      await WebBrowser.openBrowserAsync(normalizeUrl(b.url));
    } catch {
      toast.error('Could not open the link');
    }
  };

  const copy = async (b: Bookmark) => {
    try {
      await Clipboard.setStringAsync(b.url);
      toast.success('URL copied to clipboard');
    } catch {
      toast.error('Could not copy the URL');
    }
  };

  const edit = (b: Bookmark) => router.push(`/bookmark/${b.id}`);

  const remove = async (b: Bookmark) => {
    const ok = await confirm({
      title: 'Delete bookmark',
      description: `Delete "${b.title || b.url}"? This cannot be undone.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok) {
      deleteBookmark(b.id);
      toast.success('Bookmark deleted');
    }
  };

  return { open, copy, edit, remove };
}
