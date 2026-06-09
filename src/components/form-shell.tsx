import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/lib/theme';
import { Text } from './ui/text';

/**
 * Full-screen form wrapper with a sticky header (close + title + save action),
 * mirroring the PWA's FormShell.
 */
export function FormShell({
  title,
  onClose,
  saveLabel = 'Save',
  onSave,
  saveDisabled,
  children,
}: {
  title: string;
  onClose: () => void;
  saveLabel?: string;
  onSave?: () => void;
  saveDisabled?: boolean;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="flex-row items-center justify-between border-b border-border px-3 pb-3">
        <Pressable onPress={onClose} hitSlop={8} className="h-9 w-9 items-center justify-center">
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {onSave ? (
          <Pressable onPress={onSave} disabled={saveDisabled} hitSlop={8} className="h-9 px-2 justify-center">
            <Text
              className={saveDisabled ? 'text-base font-semibold text-muted-foreground' : 'text-base font-semibold text-primary'}>
              {saveLabel}
            </Text>
          </Pressable>
        ) : (
          <View className="h-9 w-9" />
        )}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 18 }}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
