import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import type { ComponentProps } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { Text } from '@/components/ui/text';
import { downloadBackup, restoreFromBackup } from '@/lib/backup';
import { useAuth } from '@/lib/auth-context';
import { useBookmarks } from '@/lib/context';
import { loadBookmarks, loadCollections, loadSettings } from '@/lib/storage';
import { fetchAndMerge, getLastSyncTime, uploadBackup, uploadData } from '@/lib/sync';
import { cn } from '@/lib/cn';
import { useColors } from '@/lib/theme';
import { toast } from '@/lib/toast';
import type { AppSettings } from '@/lib/types';

type IconName = ComponentProps<typeof Ionicons>['name'];

const THEME_OPTIONS: { label: string; value: AppSettings['themePreference']; icon: IconName }[] = [
  { label: 'Light', value: 'light', icon: 'sunny' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
  { label: 'System', value: 'system', icon: 'phone-portrait' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const confirm = useConfirm();
  const colors = useColors();
  const { user, logout } = useAuth();
  const { settings, updateSettings, bookmarks, collections, restore } = useBookmarks();

  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    getLastSyncTime().then((ts) => setLastSync(ts ? new Date(ts).toLocaleString() : null));
  }, [user]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await fetchAndMerge({ bookmarks, collections, settings });
      if (result) {
        restore(result.merged);
        await uploadData(result.merged);
      } else {
        await uploadBackup();
      }
      const ts = await getLastSyncTime();
      if (ts) setLastSync(new Date(ts).toLocaleString());
      toast.success('Synced to the cloud');
    } catch (e) {
      toast.error((e as Error).message ?? 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Sign out',
      description: 'Are you sure you want to sign out?',
      confirmText: 'Sign out',
      destructive: true,
    });
    if (ok) {
      logout();
      toast.success('Signed out');
    }
  };

  const handleExport = async () => {
    try {
      await downloadBackup();
    } catch {
      toast.error('Could not export backup');
    }
  };

  const handleRestore = async () => {
    const ok = await confirm({
      title: 'Restore backup',
      description: 'This replaces all current bookmarks and collections with the backup data. This cannot be undone.',
      confirmText: 'Choose file',
      destructive: true,
    });
    if (!ok) return;
    setRestoring(true);
    try {
      const restored = await restoreFromBackup();
      if (restored) {
        const [b, c, s] = await Promise.all([loadBookmarks(), loadCollections(), loadSettings()]);
        restore({ bookmarks: b, collections: c, settings: s });
        toast.success('Backup restored');
      }
    } catch (e) {
      toast.error((e as Error).message ?? 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 26 }}>
        {/* Account */}
        <Section title="Account">
          <Card>
            {user ? (
              <>
                <View className="flex-row items-center gap-3 px-4 py-3.5">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <Text className="text-base font-semibold text-primary-foreground">
                      {user.email[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-sm font-medium text-foreground">
                      {user.email}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {lastSync ? `Last synced: ${lastSync}` : 'Not synced yet'}
                    </Text>
                  </View>
                </View>
                <RowButton
                  icon="cloud-upload"
                  iconColor="#2563eb"
                  title="Sync now"
                  subtitle="Upload a backup to the cloud"
                  loading={syncing}
                  onPress={handleSync}
                  topBorder
                />
                <RowButton
                  icon="log-out"
                  iconColor={colors.destructive}
                  title="Sign out"
                  destructive
                  onPress={handleLogout}
                  topBorder
                />
              </>
            ) : (
              <>
                <View className="flex-row items-center gap-3 px-4 py-3.5">
                  <Glyph icon="cloud-upload" color={colors.primary} />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">Cloud backup</Text>
                    <Text className="text-xs text-muted-foreground">Sign in to back up and sync across devices.</Text>
                  </View>
                </View>
                <RowButton icon="log-in" iconColor={colors.primary} title="Sign in" onPress={() => router.push('/login')} topBorder />
                <RowButton icon="person-add" iconColor={colors.primary} title="Create account" onPress={() => router.push('/register')} topBorder />
              </>
            )}
          </Card>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <View className="flex-row gap-2 rounded-2xl border border-border bg-card p-2">
            {THEME_OPTIONS.map((opt) => {
              const active = settings.themePreference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => updateSettings({ themePreference: opt.value })}
                  className={cn(
                    'flex-1 items-center gap-2 rounded-xl py-4',
                    active ? 'bg-primary' : '',
                  )}>
                  <Ionicons name={opt.icon} size={20} color={active ? colors.primaryForeground : colors.mutedForeground} />
                  <Text className={cn('text-sm font-medium', active ? 'text-primary-foreground' : 'text-muted-foreground')}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Backup & Restore */}
        <Section title="Backup & Restore">
          <Card>
            <View className="flex-row border-b border-border">
              <Stat value={bookmarks.length} label="Bookmarks" />
              <View className="w-px bg-border" />
              <Stat value={collections.length} label="Collections" />
            </View>
            <RowButton
              icon="download"
              iconColor="#059669"
              title="Export backup"
              subtitle="Save all bookmarks as a JSON file"
              onPress={handleExport}
              bottomBorder
            />
            <RowButton
              icon="cloud-upload-outline"
              iconColor="#d97706"
              title="Restore backup"
              subtitle="Import bookmarks from a backup file"
              loading={restoring}
              onPress={handleRestore}
            />
          </Card>
        </Section>

        {/* About */}
        <Section title="About">
          <Card>
            <View className="flex-row items-center gap-4 p-4">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <Ionicons name="bookmark" size={28} color={colors.primaryForeground} />
              </View>
              <View>
                <Text className="text-base font-semibold text-foreground">Stash</Text>
                <Text className="text-xs text-muted-foreground">Version 1.0.0</Text>
                <Text className="text-xs text-muted-foreground">A modern, easy-to-use bookmark manager</Text>
              </View>
            </View>
          </Card>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-primary">{title}</Text>
      {children}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="overflow-hidden rounded-2xl border border-border bg-card">{children}</View>;
}

function Glyph({ icon, color }: { icon: IconName; color: string }) {
  return (
    <View style={{ backgroundColor: `${color}26` }} className="h-9 w-9 items-center justify-center rounded-lg">
      <Ionicons name={icon} size={18} color={color} />
    </View>
  );
}

function RowButton({
  icon,
  iconColor,
  title,
  subtitle,
  loading,
  destructive,
  topBorder,
  bottomBorder,
  onPress,
}: {
  icon: IconName;
  iconColor: string;
  title: string;
  subtitle?: string;
  loading?: boolean;
  destructive?: boolean;
  topBorder?: boolean;
  bottomBorder?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        topBorder && 'border-t border-border',
        bottomBorder && 'border-b border-border',
        loading && 'opacity-60',
      )}>
      <View style={{ backgroundColor: `${iconColor}26` }} className="h-9 w-9 items-center justify-center rounded-lg">
        {loading ? <ActivityIndicator size="small" color={iconColor} /> : <Ionicons name={icon} size={18} color={iconColor} />}
      </View>
      <View className="flex-1">
        <Text className={cn('text-sm font-medium', destructive ? 'text-destructive' : 'text-foreground')}>{title}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground">{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 items-center py-4">
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
