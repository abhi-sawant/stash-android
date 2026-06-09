import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { useColors } from '@/lib/theme';

export function Textarea({
  className,
  ...props
}: TextInputProps & { className?: string }) {
  const colors = useColors();
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      placeholderTextColor={colors.mutedForeground}
      className={cn(
        'min-h-[88px] rounded-lg border border-input bg-card px-3 py-2.5 text-[15px] text-foreground',
        className,
      )}
      {...props}
    />
  );
}
