import { Pressable, View } from 'react-native';
import { CollectionIcon } from '@/components/collection-icon';
import { ContextMenu } from '@/components/context-menu';
import type { Collection } from '@/lib/types';
import { Text } from './ui/text';

export function CollectionCard({
  collection,
  bookmarkCount,
  onOpen,
  onEdit,
  onDelete,
}: {
  collection: Collection;
  bookmarkCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      onPress={onOpen}
      className="flex-row items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3">
      <View
        style={{ backgroundColor: `${collection.color}20` }}
        className="h-11 w-11 items-center justify-center rounded-xl">
        <CollectionIcon icon={collection.icon} size={20} color={collection.color} />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
          {collection.name}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {bookmarkCount} {bookmarkCount === 1 ? 'link' : 'links'}
        </Text>
      </View>
      <ContextMenu
        actions={[
          { label: 'Edit', icon: 'pencil', onSelect: onEdit },
          { label: 'Delete', icon: 'trash', onSelect: onDelete, destructive: true },
        ]}
      />
      <View style={{ backgroundColor: collection.color }} className="absolute inset-y-0 right-0 w-1" />
    </Pressable>
  );
}
