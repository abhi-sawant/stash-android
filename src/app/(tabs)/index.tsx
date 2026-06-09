import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { BookmarkCard } from '@/components/bookmark-card';
import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { FilterChips } from '@/components/filter-chips';
import { PageHeader } from '@/components/page-header';
import { SearchBar } from '@/components/search-bar';
import { Button } from '@/components/ui/button';
import { Masonry } from '@/components/masonry';
import { useBookmarkActions } from '@/hooks/use-bookmark-actions';
import { useBookmarks } from '@/lib/context';
import { searchFilter } from '@/lib/utils';

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarks, collections, loading } = useBookmarks();
  const actions = useBookmarkActions();
  const [query, setQuery] = useState('');
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const collectionMap = useMemo(() => new Map(collections.map((c) => [c.id, c])), [collections]);

  const filtered = useMemo(
    () =>
      bookmarks.filter(
        (b) =>
          (activeCollection === null || b.collectionId === activeCollection) &&
          searchFilter(query, b.title, b.subtitle, b.url),
      ),
    [bookmarks, activeCollection, query],
  );

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Stash" subtitle={`${bookmarks.length} saved links`} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 12 }}>
          <SearchBar value={query} onChange={setQuery} />
          {collections.length > 0 ? (
            <FilterChips collections={collections} activeId={activeCollection} onChange={setActiveCollection} />
          ) : null}

          {filtered.length === 0 ? (
            bookmarks.length === 0 ? (
              <EmptyState
                icon="bookmark-outline"
                title="No bookmarks yet"
                subtitle="Save your first link to get started."
                action={<Button title="Add bookmark" onPress={() => router.push('/bookmark/new')} />}
              />
            ) : (
              <EmptyState icon="search-outline" title="No matches" subtitle="Try a different search or filter." />
            )
          ) : (
            <Masonry
              items={filtered}
              getKey={(b) => b.id}
              renderItem={(b) => (
                <BookmarkCard
                  bookmark={b}
                  collection={b.collectionId ? collectionMap.get(b.collectionId) : undefined}
                  onOpen={() => actions.open(b)}
                  onEdit={() => actions.edit(b)}
                  onCopy={() => actions.copy(b)}
                  onDelete={() => actions.remove(b)}
                />
              )}
            />
          )}
        </ScrollView>
      )}

      <Fab onPress={() => router.push('/bookmark/new')} />
    </View>
  );
}
