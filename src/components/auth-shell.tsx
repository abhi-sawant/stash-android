import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ComponentProps } from 'react';
import { useColors } from '@/lib/theme';
import { Text } from './ui/text';

export function AuthShell({
  icon = 'bookmark',
  title,
  subtitle,
  children,
}: {
  icon?: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled">
        <View className="mb-7 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Ionicons name={icon} size={30} color={colors.primaryForeground} />
          </View>
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
          {subtitle ? (
            <Text className="mt-1.5 text-center text-[15px] text-muted-foreground">{subtitle}</Text>
          ) : null}
        </View>
        <View className="gap-4">{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
