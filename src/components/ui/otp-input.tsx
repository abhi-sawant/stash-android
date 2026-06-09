import { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

/**
 * 6-digit OTP input. A single hidden TextInput captures the code; six cells
 * display it. Tapping anywhere focuses the input.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<TextInput>(null);
  const cells = Array.from({ length });

  return (
    <Pressable className="flex-row justify-center gap-2" onPress={() => ref.current?.focus()}>
      {cells.map((_, i) => {
        const char = value[i] ?? '';
        const active = i === value.length;
        return (
          <View
            key={i}
            className={cn(
              'h-12 w-11 items-center justify-center rounded-lg border',
              active ? 'border-primary' : 'border-input',
            )}>
            <Text className="text-lg font-semibold text-foreground">{char}</Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        editable={!disabled}
        className="absolute h-px w-px opacity-0"
      />
    </Pressable>
  );
}
