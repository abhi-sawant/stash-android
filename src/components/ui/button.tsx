import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

type Variant = 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost';
type Size = 'default' | 'sm' | 'lg' | 'icon';

const containerVariants: Record<Variant, string> = {
  default: 'bg-primary',
  outline: 'border border-border bg-transparent',
  secondary: 'bg-secondary',
  destructive: 'bg-destructive',
  ghost: 'bg-transparent',
};

const textVariants: Record<Variant, string> = {
  default: 'text-primary-foreground',
  outline: 'text-foreground',
  secondary: 'text-secondary-foreground',
  destructive: 'text-white',
  ghost: 'text-foreground',
};

const sizeVariants: Record<Size, string> = {
  default: 'h-11 px-4',
  sm: 'h-9 px-3',
  lg: 'h-12 px-5',
  icon: 'h-11 w-11',
};

const spinnerColor: Record<Variant, string> = {
  default: '#fafafa',
  outline: '#873eec',
  secondary: '#522a92',
  destructive: '#ffffff',
  ghost: '#873eec',
};

export interface ButtonProps extends PressableProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  title?: string;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  title,
  className,
  textClassName,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-lg',
        containerVariants[variant],
        sizeVariants[size],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}>
      {loading ? (
        <ActivityIndicator color={spinnerColor[variant]} />
      ) : title ? (
        <Text className={cn('text-[15px] font-semibold', textVariants[variant], textClassName)}>{title}</Text>
      ) : (
        <View className="flex-row items-center justify-center gap-2">{children}</View>
      )}
    </Pressable>
  );
}
