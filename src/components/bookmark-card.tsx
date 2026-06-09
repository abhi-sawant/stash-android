import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ContextMenu } from '@/components/context-menu';
import { useColors } from '@/lib/theme';
import type { Bookmark, Collection } from '@/lib/types';
import { extractDomain, formatDate } from '@/lib/utils';
import { Text } from './ui/text';

export function BookmarkCard({
  bookmark,
  collection,
  onOpen,
  onEdit,
  onCopy,
  onDelete,
}: {
  bookmark: Bookmark;
  collection?: Collection;
  onOpen: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  return (
    <Pressable
      onPress={onOpen}
      className="overflow-hidden rounded-2xl border border-border bg-card">
      {bookmark.imageUri && !imageFailed ? (
        <Image
          source={{ uri: bookmark.imageUri }}
          onError={() => setImageFailed(true)}
          contentFit="cover"
          transition={150}
          style={{ width: '100%', aspectRatio: 16 / 9 }}
        />
      ) : null}

      <View className="gap-1.5 p-3">
        {/* Domain row */}
        <View className="flex-row items-center gap-1.5">
          {bookmark.faviconUri && !faviconFailed ? (
            <Image
              source={{ uri: bookmark.faviconUri }}
              onError={() => setFaviconFailed(true)}
              style={{ width: 14, height: 14, borderRadius: 3 }}
            />
          ) : (
            <View className="h-4 w-4 items-center justify-center rounded-sm bg-muted">
              <Ionicons name="link" size={10} color={colors.primary} />
            </View>
          )}
          <Text numberOfLines={1} className="flex-1 text-[11px] font-medium text-muted-foreground">
            {extractDomain(bookmark.url)}
          </Text>
        </View>

        {/* Title */}
        <Text numberOfLines={3} className="text-sm font-semibold leading-snug text-foreground">
          {bookmark.title || extractDomain(bookmark.url)}
        </Text>

        {/* Description */}
        {bookmark.subtitle ? (
          <Text numberOfLines={2} className="text-xs leading-relaxed text-muted-foreground">
            {bookmark.subtitle}
          </Text>
        ) : null}

        {/* Footer */}
        <View className="mt-1 flex-row items-center justify-between gap-2">
          {collection ? (
            <View
              style={{ backgroundColor: `${collection.color}22` }}
              className="max-w-[70%] flex-row items-center gap-1 rounded-full px-2 py-0.5">
              <Ionicons name="folder" size={10} color={collection.color} />
              <Text numberOfLines={1} style={{ color: collection.color }} className="text-[11px] font-medium">
                {collection.name}
              </Text>
            </View>
          ) : (
            <Text className="text-[11px] text-muted-foreground">{formatDate(bookmark.createdAt)}</Text>
          )}
          <ContextMenu
            actions={[
              { label: 'Edit', icon: 'pencil', onSelect: onEdit },
              { label: 'Copy URL', icon: 'copy', onSelect: onCopy },
              { label: 'Delete', icon: 'trash', onSelect: onDelete, destructive: true },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
}
