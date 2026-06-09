import { View } from 'react-native';

/**
 * Simple column-distribution masonry. Splits items round-robin across `columns`
 * vertical stacks so cards of varying height pack tightly. Mirrors the PWA's
 * lightweight masonry (no third-party dependency).
 */
export function Masonry<T>({
  items,
  columns = 2,
  gap = 12,
  getKey,
  renderItem,
}: {
  items: T[];
  columns?: number;
  gap?: number;
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
}) {
  const cols: T[][] = Array.from({ length: columns }, () => []);
  items.forEach((item, i) => cols[i % columns].push(item));

  return (
    <View className="flex-row" style={{ gap }}>
      {cols.map((col, ci) => (
        <View key={ci} className="flex-1" style={{ gap }}>
          {col.map((item) => (
            <View key={getKey(item)}>{renderItem(item)}</View>
          ))}
        </View>
      ))}
    </View>
  );
}
