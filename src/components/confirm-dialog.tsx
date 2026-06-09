import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal visible={!!options} transparent animationType="fade" onRequestClose={() => close(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-8" onPress={() => close(false)}>
          <Pressable className="w-full max-w-sm rounded-2xl bg-popover p-5" onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-semibold text-popover-foreground">{options?.title}</Text>
            {options?.description ? (
              <Text className="mt-2 text-[15px] text-muted-foreground">{options.description}</Text>
            ) : null}
            <View className="mt-5 flex-row justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                title={options?.cancelText ?? 'Cancel'}
                onPress={() => close(false)}
              />
              <Button
                variant={options?.destructive ? 'destructive' : 'default'}
                size="sm"
                title={options?.confirmText ?? 'Confirm'}
                onPress={() => close(true)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
