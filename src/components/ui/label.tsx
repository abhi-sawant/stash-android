import { cn } from '@/lib/cn';
import { Text } from './text';

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('mb-1.5 text-[13px] font-medium text-foreground', className)}>{children}</Text>;
}
