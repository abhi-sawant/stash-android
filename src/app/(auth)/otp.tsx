import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { useConfirm } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth-context';
import { useBookmarks } from '@/lib/context';
import { fetchLatestBackup, fetchThumbnails, rehydrateThumbnails } from '@/lib/sync';
import type { AppSettings, Bookmark, Collection } from '@/lib/types';

export default function OtpScreen() {
  const router = useRouter();
  const confirm = useConfirm();
  const { pendingEmail, verifyOtp, resendOtp } = useAuth();
  const { restore } = useBookmarks();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!pendingEmail) router.replace('/login');
  }, [pendingEmail, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleVerify = async (code: string) => {
    if (!pendingEmail || code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(pendingEmail, code);
      // Offer to restore a remote backup if one exists.
      try {
        const backup = await fetchLatestBackup();
        if (backup?.data) {
          const date = new Date(backup.created_at).toLocaleDateString();
          const ok = await confirm({
            title: 'Backup found',
            description: `A backup from ${date} was found on the server. Would you like to restore it?`,
            confirmText: 'Restore',
            cancelText: 'Skip',
          });
          if (ok) {
            let bookmarks = (backup.data.bookmarks as Bookmark[]) ?? [];
            try {
              const thumbMap = await fetchThumbnails();
              bookmarks = rehydrateThumbnails(bookmarks, thumbMap);
            } catch {
              // If thumbnail fetch fails, use whatever imageUri is in the backup
            }
            restore({
              bookmarks,
              collections: (backup.data.collections as Collection[]) ?? [],
              settings: (backup.data.settings as AppSettings) ?? { themePreference: 'system' },
            });
          }
        }
      } catch {
        // Ignore backup-check failures — still sign in.
      }
      router.replace('/');
    } catch (err) {
      submittedRef.current = false;
      setOtp('');
      setError((err as Error).message ?? 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail || cooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      await resendOtp(pendingEmail);
      setCooldown(60);
      setOtp('');
    } catch (err) {
      setError((err as Error).message ?? 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell icon="mail-open" title="Check your email" subtitle={`We sent a 6-digit code to\n${pendingEmail ?? ''}`}>
      <OtpInput
        value={otp}
        autoFocus
        disabled={loading}
        onChange={(value) => {
          setOtp(value);
          setError(null);
          if (value.length === 6 && !submittedRef.current) {
            submittedRef.current = true;
            void handleVerify(value);
          }
        }}
      />
      {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}
      <Button
        title={loading ? undefined : 'Verify'}
        loading={loading}
        disabled={otp.length !== 6}
        onPress={() => handleVerify(otp)}
      />
      <View className="flex-row items-center justify-center gap-1">
        <Text className="text-sm text-muted-foreground">Didn&apos;t receive the code?</Text>
        <Text
          onPress={handleResend}
          className={cooldown > 0 || resending ? 'text-sm font-semibold text-muted-foreground' : 'text-sm font-semibold text-primary'}>
          {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
        </Text>
      </View>
    </AuthShell>
  );
}
