import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/lib/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password);
      router.push('/otp');
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell icon="person-add" title="Create your account" subtitle="Back up and sync your bookmarks across devices">
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
        <Label>Password</Label>
        <PasswordInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" />
      </View>
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      <Button title={loading ? undefined : 'Create account'} loading={loading} onPress={handleSubmit} />
      <Text className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </Text>
    </AuthShell>
  );
}
