import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';
import { useColors } from '@/lib/theme';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search bookmarks...',
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const colors = useColors();
  return (
    <View className="h-11 flex-row items-center gap-2 rounded-lg border border-input bg-card px-3">
      <Ionicons name="search" size={18} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="flex-1 text-[15px] text-foreground"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}
