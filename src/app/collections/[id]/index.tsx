import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookmarkCard } from '@/components/bookmark-card';
import { CollectionIcon } from '@/components/collection-icon';
import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { Masonry } from '@/components/masonry';
import { SearchBar } from '@/components/search-bar';
import { Text } from '@/components/ui/text';
import { useBookmarkActions } from '@/hooks/use-bookmark-actions';
import { useBookmarks } from '@/lib/context';
import { useColors } from '@/lib/theme';
import { searchFilter } from '@/lib/utils';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { bookmarks, collections } = useBookmarks();
  const actions = useBookmarkActions();
  const [query, setQuery] = useState('');

  const collection = collections.find((c) => c.id === id);

  const filtered = useMemo(
    () =>
      bookmarks.filter(
        (b) => b.collectionId === id && searchFilter(query, b.title, b.subtitle, b.url),
      ),
    [bookmarks, id, query],
  );

  if (!collection) {
    return (
      <View className="flex-1 items-center justify-center bg-background" style={{ paddingTop: insets.top }}>
        <EmptyState icon="folder-outline" title="Collection not found" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center gap-2 border-b border-border px-3 pb-3">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-9 w-9 items-center justify-center">
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View
          style={{ backgroundColor: `${collection.color}20` }}
          className="h-8 w-8 items-center justify-center rounded-lg">
          <CollectionIcon icon={collection.icon} size={16} color={collection.color} />
        </View>
        <Text numberOfLines={1} className="flex-1 text-lg font-bold text-foreground">
          {collection.name}
        </Text>
        <Pressable onPress={() => router.push(`/collections/${id}/edit`)} hitSlop={8} className="h-9 w-9 items-center justify-center">
          <Ionicons name="pencil" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 12 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search in collection…" />
        {filtered.length === 0 ? (
          <EmptyState
            icon="bookmark-outline"
            title={query ? 'No matches' : 'No bookmarks yet'}
            subtitle={query ? 'Try a different search.' : 'Add a bookmark to this collection.'}
          />
        ) : (
          <Masonry
            items={filtered}
            getKey={(b) => b.id}
            renderItem={(b) => (
              <BookmarkCard
                bookmark={b}
                collection={collection}
                onOpen={() => actions.open(b)}
                onEdit={() => actions.edit(b)}
                onCopy={() => actions.copy(b)}
                onDelete={() => actions.remove(b)}
              />
            )}
          />
        )}
      </ScrollView>

      <Fab onPress={() => router.push(`/bookmark/new?collection=${id}`)} />
    </View>
  );
}
