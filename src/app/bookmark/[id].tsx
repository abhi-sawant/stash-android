import { useLocalSearchParams } from 'expo-router';
import { BookmarkForm } from '@/components/bookmark-form';

export default function EditBookmarkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookmarkForm id={id} />;
}
