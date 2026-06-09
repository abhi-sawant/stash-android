import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// A few stored keys differ from valid Ionicons names.
const REMAP: Record<string, string> = {
  'paint-brush': 'brush',
};

/**
 * Renders a collection icon. The stored icon keys are Ionicons names; we append
 * "-outline" for a lighter look and fall back to "folder" for unknown keys.
 */
export function CollectionIcon({
  icon,
  size = 20,
  color,
}: {
  icon: string;
  size?: number;
  color: string;
}) {
  const base = REMAP[icon] ?? icon;
  const name = `${base}-outline` as IoniconName;
  return <Ionicons name={name} size={size} color={color} />;
}
