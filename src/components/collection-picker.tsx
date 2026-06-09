import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker, IconPicker } from '@/components/pickers';
import { COLLECTION_COLORS, COLLECTION_ICONS } from '@/lib/collections';
import { useBookmarks } from '@/lib/context';
import { useColors } from '@/lib/theme';
import { cn } from '@/lib/cn';
import { Text } from './ui/text';

export function CollectionPicker({
  value,
  onChange,
  allowNone = false,
  invalid = false,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  allowNone?: boolean;
  invalid?: boolean;
}) {
  const { collections, addCollection } = useBookmarks();
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'list' | 'create'>('list');

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(COLLECTION_COLORS[0]);
  const [icon, setIcon] = useState<string>(COLLECTION_ICONS[0]);

  const selected = collections.find((c) => c.id === value);

  const resetCreate = () => {
    setName('');
    setColor(COLLECTION_COLORS[0]);
    setIcon(COLLECTION_ICONS[0]);
  };

  const openPicker = () => {
    setMode('list');
    setOpen(true);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = addCollection({ name: name.trim(), color, icon });
    onChange(id);
    resetCreate();
    setMode('list');
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        className={cn(
          'h-11 flex-row items-center gap-2 rounded-lg border bg-card px-3',
          invalid ? 'border-destructive' : 'border-input',
        )}>
        {selected ? (
          <>
            <View style={{ backgroundColor: selected.color }} className="h-3 w-3 rounded-full" />
            <Text numberOfLines={1} className="flex-1 text-foreground">
              {selected.name}
            </Text>
          </>
        ) : (
          <Text className="flex-1 text-muted-foreground">Select a collection</Text>
        )}
        <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable
            className="max-h-[80%] rounded-t-3xl bg-popover"
            onPress={(e) => e.stopPropagation()}>
            {mode === 'list' ? (
              <View className="flex-shrink">
                <View className="flex-row items-center justify-between border-b border-border p-4">
                  <Text className="text-base font-semibold text-popover-foreground">Select collection</Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => setMode('create')}
                    className="px-2"
                    textClassName="text-primary">
                    <Ionicons name="add" size={18} color={colors.primary} />
                    <Text className="text-sm font-semibold text-primary">New</Text>
                  </Button>
                </View>
                <ScrollView contentContainerStyle={{ padding: 8 }}>
                  {allowNone ? (
                    <Pressable
                      onPress={() => {
                        onChange(null);
                        setOpen(false);
                      }}
                      className="flex-row items-center gap-3 rounded-lg px-3 py-3">
                      <Text className="flex-1 text-muted-foreground">No collection</Text>
                      {value === null ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                    </Pressable>
                  ) : null}
                  {collections.map((col) => (
                    <Pressable
                      key={col.id}
                      onPress={() => {
                        onChange(col.id);
                        setOpen(false);
                      }}
                      className="flex-row items-center gap-3 rounded-lg px-3 py-3">
                      <View style={{ backgroundColor: col.color }} className="h-3 w-3 rounded-full" />
                      <Text numberOfLines={1} className="flex-1 text-popover-foreground">
                        {col.name}
                      </Text>
                      {value === col.id ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                    </Pressable>
                  ))}
                  {collections.length === 0 ? (
                    <Text className="px-3 py-6 text-center text-muted-foreground">
                      No collections yet. Tap “New” to create one.
                    </Text>
                  ) : null}
                </ScrollView>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
                <View className="flex-row items-center gap-2">
                  <Pressable onPress={() => setMode('list')} hitSlop={8}>
                    <Ionicons name="arrow-back" size={22} color={colors.foreground} />
                  </Pressable>
                  <Text className="text-base font-semibold text-popover-foreground">New collection</Text>
                </View>
                <View>
                  <Label>Name</Label>
                  <Input value={name} onChangeText={setName} placeholder="e.g. Reading list" autoFocus />
                </View>
                <View>
                  <Label>Color</Label>
                  <ColorPicker value={color} onChange={setColor} />
                </View>
                <View>
                  <Label>Icon</Label>
                  <IconPicker value={icon} color={color} onChange={setIcon} />
                </View>
                <Button title="Create collection" onPress={handleCreate} disabled={!name.trim()} />
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
