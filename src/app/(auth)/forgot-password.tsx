import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { api } from '@/lib/api';
import { useColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const normalized = email.trim().toLowerCase();
      await api.auth.forgotPassword(normalized);
      toast.success('Reset code sent — check your email.');
      router.push(`/reset-password?email=${encodeURIComponent(normalized)}`);
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell icon="key" title="Forgot password?" subtitle="Enter your email and we'll send you a reset code">
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
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      <Button title={loading ? undefined : 'Send reset code'} loading={loading} onPress={handleSubmit} />
    </AuthShell>
  );
}
