import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import type { ComponentProps } from 'react';
import { useColors } from '@/lib/theme';
import { Text } from './ui/text';

export interface MenuAction {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onSelect: () => void;
  destructive?: boolean;
}

/** An overflow (•••) button that opens a bottom action sheet of `actions`. */
export function ContextMenu({ actions }: { actions: MenuAction[] }) {
  const [open, setOpen] = useState(false);
  const colors = useColors();

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        className="h-8 w-8 items-center justify-center rounded-full">
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.mutedForeground} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable
            className="mx-3 mb-6 overflow-hidden rounded-2xl bg-popover"
            onPress={(e) => e.stopPropagation()}>
            {actions.map((a, i) => (
              <Pressable
                key={a.label}
                onPress={() => {
                  setOpen(false);
                  a.onSelect();
                }}
                className={`flex-row items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-border' : ''}`}>
                <Ionicons name={a.icon} size={20} color={a.destructive ? colors.destructive : colors.foreground} />
                <Text className={a.destructive ? 'text-base text-destructive' : 'text-base text-popover-foreground'}>
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
