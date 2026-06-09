import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './ui/text';

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingTop: insets.top + 8 }}
      className="flex-row items-end justify-between border-b border-border bg-background px-4 pb-3">
      <View className="flex-1">
        <Text className="text-2xl font-bold text-foreground">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</Text> : null}
      </View>
      {right ? <View className="ml-3 flex-row items-center gap-2">{right}</View> : null}
    </View>
  );
}
