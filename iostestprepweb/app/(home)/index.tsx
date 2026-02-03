import { SignedIn, SignedOut, useUser, useSSO } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SignOutButton } from '@/components/SignOutButton';
import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';

if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export default function HomePage() {
  const { user } = useUser();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const onGooglePress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
      });
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));
    }
  }, [startSSOFlow, router]);

  const onApplePress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_apple',
      });
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));
    }
  }, [startSSOFlow, router]);

  return (
    <View style={styles.container}>
      <SignedIn>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.email}>{user?.emailAddresses[0].emailAddress}</Text>
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <Text style={styles.title}>Welcome to TestPrep2026</Text>

        <View style={styles.oauthContainer}>
          <TouchableOpacity style={styles.googleButton} onPress={onGooglePress}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.appleButton} onPress={onApplePress}>
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
      </SignedOut>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  email: {
    fontSize: 16,
    color: '#666',
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
    borderRadius: 8,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#ccc',
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
    borderRadius: 8,
  },
  linkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
