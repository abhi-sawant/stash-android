import { Pressable, ScrollView } from 'react-native';
import { cn } from '@/lib/cn';
import type { Collection } from '@/lib/types';
import { Text } from './ui/text';

export function FilterChips({
  collections,
  activeId,
  onChange,
}: {
  collections: Collection[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}) {
  const chip = (id: string | null, label: string, color?: string) => {
    const active = activeId === id;
    return (
      <Pressable
        key={id ?? 'all'}
        onPress={() => onChange(id)}
        className={cn(
          'h-9 flex-row items-center gap-1.5 rounded-full border px-3.5',
          active ? 'border-primary bg-primary' : 'border-border bg-card',
        )}>
        {color ? (
          <Text style={{ color }} className="text-base leading-none">
            ●
          </Text>
        ) : null}
        <Text className={cn('text-[13px] font-medium', active ? 'text-primary-foreground' : 'text-foreground')}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
      {chip(null, 'All')}
      {collections.map((c) => chip(c.id, c.name, c.color))}
    </ScrollView>
  );
}
