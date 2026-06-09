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

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.push('/otp');
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell icon="bookmark" title="Welcome back" subtitle="Sign in to enable automatic cloud backups">
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
        <PasswordInput value={password} onChangeText={setPassword} placeholder="Your password" />
      </View>
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      <Button title={loading ? undefined : 'Sign in'} loading={loading} onPress={handleSubmit} />
      <View className="items-center gap-3">
        <Link href="/forgot-password" className="text-sm font-medium text-primary">
          Forgot password?
        </Link>
        <Text className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-primary">
            Create one
          </Link>
        </Text>
      </View>
    </AuthShell>
  );
}
