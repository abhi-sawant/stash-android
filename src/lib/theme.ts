import { useColorScheme } from 'nativewind';

/**
 * The Stash violet palette as resolved hex values, for the few places that need
 * a JS color string instead of a Tailwind class (e.g. Ionicons / lucide `color`
 * props, status bar, native components). Mirrors the CSS variables in global.css.
 */
interface Palette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
}

export const palette: { light: Palette; dark: Palette } = {
  light: {
    background: '#f8f6ff',
    foreground: '#181721',
    card: '#ffffff',
    cardForeground: '#181721',
    popover: '#ffffff',
    popoverForeground: '#181721',
    primary: '#873eec',
    primaryForeground: '#fafafa',
    secondary: '#f1eefb',
    secondaryForeground: '#522a92',
    muted: '#f3f1fa',
    mutedForeground: '#626174',
    accent: '#eeeafc',
    accentForeground: '#522a92',
    destructive: '#e7000b',
    border: '#e0dee9',
    input: '#e0dee9',
    ring: '#873eec',
  },
  dark: {
    background: '#100f17',
    foreground: '#f4f2fa',
    card: '#1b1a25',
    cardForeground: '#f4f2fa',
    popover: '#1b1a25',
    popoverForeground: '#f4f2fa',
    primary: '#ae9af5',
    primaryForeground: '#181625',
    secondary: '#262531',
    secondaryForeground: '#e6e2f4',
    muted: '#262531',
    mutedForeground: '#a5a1b6',
    accent: '#312c43',
    accentForeground: '#e0d8fc',
    destructive: '#ff6467',
    border: '#2d2c33',
    input: '#34333a',
    ring: '#ae9af5',
  },
};

export type ThemeColors = Palette;

/** Returns the resolved palette for the active color scheme. */
export function useColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? palette.dark : palette.light;
}
