import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useColors } from '@/lib/theme';
import type { ComponentProps } from 'react';
import { Text } from './ui/text';

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-accent">
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
      {subtitle ? (
        <Text className="mt-1.5 text-center text-[15px] text-muted-foreground">{subtitle}</Text>
      ) : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}
