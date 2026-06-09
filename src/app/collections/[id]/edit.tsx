import { useLocalSearchParams } from 'expo-router';
import { CollectionForm } from '@/components/collection-form';

export default function EditCollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CollectionForm id={id} />;
}
