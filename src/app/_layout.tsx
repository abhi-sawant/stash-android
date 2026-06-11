import 'react-native-url-polyfill/auto';
import '@/global.css';

import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ConfirmProvider } from '@/components/confirm-dialog';
import { ThemeController } from '@/components/theme-controller';
import { AuthProvider } from '@/lib/auth-context';
import { BookmarksProvider } from '@/lib/context';
import { useBackgroundSync } from '@/hooks/use-background-sync';

function SyncRunner() {
  useBackgroundSync();
  return null;
}

/** Routes an incoming shared link to the Add Bookmark form, pre-filled. */
function ShareIntentHandler() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (!hasShareIntent) return;
    const url = shareIntent.webUrl ?? shareIntent.text ?? '';
    if (url) router.push(`/bookmark/new?url=${encodeURIComponent(url)}`);
    resetShareIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent]);

  return null;
}

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <BookmarksProvider>
              <ThemeController />
              <SyncRunner />
              <ShareIntentHandler />
              <ConfirmProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="bookmark/new" options={{ presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="bookmark/[id]" options={{ presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="collections/new" options={{ presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="collections/[id]/edit" options={{ presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="collections/[id]/index" />
                </Stack>
              </ConfirmProvider>
              <StatusBar style="auto" />
              <Toast />
            </BookmarksProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ShareIntentProvider>
  );
}
