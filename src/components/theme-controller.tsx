import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useBookmarks } from '@/lib/context';

/**
 * Applies the user's theme preference (light / dark / system) to NativeWind's
 * color scheme. Mirrors the PWA's next-themes behaviour.
 */
export function ThemeController() {
  const { settings } = useBookmarks();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(settings.themePreference);
  }, [settings.themePreference, setColorScheme]);

  return null;
}
