import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { CollectionCard } from '@/components/collection-card';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useBookmarks } from '@/lib/context';
import { toast } from '@/lib/toast';

export default function CollectionsScreen() {
  const router = useRouter();
  const confirm = useConfirm();
  const { collections, bookmarks, deleteCollection } = useBookmarks();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookmarks) {
      if (b.collectionId) map.set(b.collectionId, (map.get(b.collectionId) ?? 0) + 1);
    }
    return map;
  }, [bookmarks]);

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete collection',
      description: `Delete "${name}"? Bookmarks in it will be kept but unassigned.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok) {
      deleteCollection(id);
      toast.success('Collection deleted');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Collections" subtitle={`${collections.length} collections`} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 12 }}>
        {collections.length === 0 ? (
          <EmptyState
            icon="albums-outline"
            title="No collections yet"
            subtitle="Group related bookmarks into collections."
            action={<Button title="New collection" onPress={() => router.push('/collections/new')} />}
          />
        ) : (
          collections.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              bookmarkCount={counts.get(c.id) ?? 0}
              onOpen={() => router.push(`/collections/${c.id}`)}
              onEdit={() => router.push(`/collections/${c.id}/edit`)}
              onDelete={() => handleDelete(c.id, c.name)}
            />
          ))
        )}
      </ScrollView>
      <Fab onPress={() => router.push('/collections/new')} />
    </View>
  );
}
