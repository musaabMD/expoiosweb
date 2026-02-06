import { Link, useRouter } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SignOutButton } from '@/components/SignOutButton';
import { useCallback, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useConvexAuth, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '@/convex/_generated/api';

if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export default function HomePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-redirect to tabs if signed in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router]);

  const onGooglePress = useCallback(async () => {
    setAuthLoading(true);
    setError('');
    try {
      await signIn('google');
      router.replace('/');
    } catch (err) {
      console.error('OAuth error:', err);
      setError('Google sign in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }, [signIn, router]);

  const onApplePress = useCallback(async () => {
    setAuthLoading(true);
    setError('');
    try {
      await signIn('apple');
      router.replace('/');
    } catch (err) {
      console.error('OAuth error:', err);
      setError('Apple sign in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }, [signIn, router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAuthenticated ? (
        <>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.email}>{currentUser?.email}</Text>
          <SignOutButton />
        </>
      ) : (
        <>
          <Text style={styles.title}>Welcome to TestPrep2026</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.oauthContainer}>
            <TouchableOpacity
              style={[styles.googleButton, authLoading && styles.buttonDisabled]}
              onPress={onGooglePress}
              disabled={authLoading}
            >
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.appleButton, authLoading && styles.buttonDisabled]}
              onPress={onApplePress}
              disabled={authLoading}
            >
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.linkContainer}>
            <Link href="/(auth)/sign-in" style={styles.link}>
              <Text style={styles.linkText}>Sign in with email</Text>
            </Link>
            <Link href="/(auth)/sign-up" style={styles.link}>
              <Text style={styles.linkText}>Sign up</Text>
            </Link>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#fff',
  },
  email: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    fontSize: 14,
  },
  oauthContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  appleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  linkContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  link: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
  },
  linkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
