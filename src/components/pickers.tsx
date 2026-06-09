import { Pressable, View } from 'react-native';
import { CollectionIcon } from '@/components/collection-icon';
import { COLLECTION_COLORS, COLLECTION_ICONS } from '@/lib/collections';

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {COLLECTION_COLORS.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          style={{ backgroundColor: c }}
          className={`h-9 w-9 items-center justify-center rounded-full ${
            value === c ? 'border-2 border-foreground' : ''
          }`}
        />
      ))}
    </View>
  );
}

export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (i: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {COLLECTION_ICONS.map((i) => {
        const active = value === i;
        return (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            style={active ? { backgroundColor: `${color}22`, borderColor: color } : undefined}
            className={`h-11 w-11 items-center justify-center rounded-xl border ${
              active ? '' : 'border-border bg-card'
            }`}>
            <CollectionIcon icon={i} size={20} color={active ? color : '#888'} />
          </Pressable>
        );
      })}
    </View>
  );
}
