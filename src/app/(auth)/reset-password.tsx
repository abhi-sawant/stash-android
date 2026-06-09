import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OtpInput } from '@/components/ui/otp-input';
import { PasswordInput } from '@/components/ui/password-input';
import { Text } from '@/components/ui/text';
import { api } from '@/lib/api';
import { useColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || otp.length !== 6 || !password) {
      setError('Please fill in your email, the 6-digit code, and a new password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword(email.trim().toLowerCase(), otp, password);
      toast.success('Password reset — sign in with your new password.');
      router.replace('/login');
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell icon="shield-checkmark" title="Reset password" subtitle="Enter the code we emailed and choose a new password">
      <View>
        <Label>Email</Label>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />}
        />
      </View>
      <View>
        <Label>Reset code</Label>
        <OtpInput value={otp} onChange={setOtp} />
      </View>
      <View>
        <Label>New password</Label>
        <PasswordInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" />
      </View>
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      <Button title={loading ? undefined : 'Reset password'} loading={loading} onPress={handleSubmit} />
    </AuthShell>
  );
}
