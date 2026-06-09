import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookmarkCard } from '@/components/bookmark-card';
import { EmptyState } from '@/components/empty-state';
import { Masonry } from '@/components/masonry';
import { SearchBar } from '@/components/search-bar';
import { useBookmarkActions } from '@/hooks/use-bookmark-actions';
import { useBookmarks } from '@/lib/context';
import { searchFilter } from '@/lib/utils';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { bookmarks, collections } = useBookmarks();
  const actions = useBookmarkActions();
  const [query, setQuery] = useState('');

  const collectionMap = useMemo(() => new Map(collections.map((c) => [c.id, c])), [collections]);

  const results = useMemo(
    () => (query.trim() ? bookmarks.filter((b) => searchFilter(query, b.title, b.subtitle, b.url)) : []),
    [bookmarks, query],
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-4 pb-2">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by title, URL, or description…" autoFocus />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 12 }}>
        {query.trim() === '' ? (
          <EmptyState icon="search-outline" title="Search your stash" subtitle="Find any saved link by title, URL, or description." />
        ) : results.length === 0 ? (
          <EmptyState icon="search-outline" title="No matches" subtitle={`Nothing found for "${query}".`} />
        ) : (
          <Masonry
            items={results}
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
    </View>
  );
}
