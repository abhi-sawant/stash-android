import { Text as RNText, type TextProps } from 'react-native';
import { cn } from '@/lib/cn';

/** Themed Text — defaults to the foreground color. */
export function Text({ className, ...props }: TextProps & { className?: string }) {
  return <RNText className={cn('text-foreground', className)} {...props} />;
}
