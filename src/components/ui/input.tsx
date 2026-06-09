import { forwardRef } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { cn } from '@/lib/cn';
import { useColors } from '@/lib/theme';

export interface InputProps extends TextInputProps {
  className?: string;
  invalid?: boolean;
  /** Optional leading icon element rendered inside the field. */
  icon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { className, invalid, icon, ...props },
  ref,
) {
  const colors = useColors();
  const field = (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.mutedForeground}
      className={cn(
        'h-11 rounded-lg border bg-card px-3 text-[15px] text-foreground',
        invalid ? 'border-destructive' : 'border-input',
        icon ? 'flex-1 border-0 bg-transparent px-0' : '',
        className,
      )}
      {...props}
    />
  );

  if (!icon) return field;

  return (
    <View
      className={cn(
        'h-11 flex-row items-center gap-2 rounded-lg border bg-card px-3',
        invalid ? 'border-destructive' : 'border-input',
      )}>
      {icon}
      {field}
    </View>
  );
});
