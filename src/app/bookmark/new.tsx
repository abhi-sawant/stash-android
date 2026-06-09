import { useLocalSearchParams } from 'expo-router';
import { BookmarkForm } from '@/components/bookmark-form';

export default function NewBookmarkScreen() {
  const { url, collection } = useLocalSearchParams<{ url?: string; collection?: string }>();
  return <BookmarkForm initialUrl={url} initialCollection={collection} />;
}
