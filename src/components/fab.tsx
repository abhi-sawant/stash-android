import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/lib/theme';

export function Fab({ onPress, icon = 'add' }: { onPress: () => void; icon?: 'add' | 'bookmark' }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ bottom: insets.bottom + 88, right: 20 }}
      className="absolute h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
      <Ionicons name={icon} size={28} color={palette.light.primaryForeground} />
    </Pressable>
  );
}
