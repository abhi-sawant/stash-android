import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';
import { useColors } from '@/lib/theme';

export function PasswordInput(props: TextInputProps) {
  const colors = useColors();
  const [show, setShow] = useState(false);
  return (
    <View className="h-11 flex-row items-center gap-2 rounded-lg border border-input bg-card px-3">
      <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
      <TextInput
        secureTextEntry={!show}
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 text-[15px] text-foreground"
        {...props}
      />
      <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}
