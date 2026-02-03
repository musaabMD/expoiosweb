import { useSignIn, useSSO } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  Section,
  Spacer,
  Text,
  TextField,
  VStack,
} from '@expo/ui/swift-ui';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onGooglePress = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: 'oauth_google',
      });

      if (createdSessionId) {
        await ssoSetActive!({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));
      setError(err?.errors?.[0]?.message || 'Google sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, router]);

  const onApplePress = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: 'oauth_apple',
      });

      if (createdSessionId) {
        await ssoSetActive!({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));
      setError(err?.errors?.[0]?.message || 'Apple sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, router]);

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError('');

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/');
      } else if (signInAttempt.status === 'needs_second_factor') {
        setError('Two-factor authentication required. Check your email for a code.');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err?.errors?.[0]?.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Sign In">
          <Button onPress={onGooglePress} disabled={isLoading}>
            <HStack>
              <Spacer />
              <Text>Continue with Google</Text>
              <Spacer />
            </HStack>
          </Button>

          <Button onPress={onApplePress} disabled={isLoading}>
            <HStack>
              <Spacer />
              <Image systemName="apple.logo" color="white" size={18} />
              <Text color="white">Continue with Apple</Text>
              <Spacer />
            </HStack>
          </Button>
        </Section>

        <Section title="Or sign in with email">
          <VStack spacing={16}>
            <HStack spacing={8}>
              <Image systemName="envelope.fill" color="gray" size={20} />
              <TextField
                placeholder="Email"
                text={emailAddress}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </HStack>

            <HStack spacing={8}>
              <Image systemName="lock.fill" color="gray" size={20} />
              <TextField
                placeholder="Password"
                text={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </HStack>
          </VStack>
        </Section>

        {error ? (
          <Section>
            <Text color="red">{error}</Text>
          </Section>
        ) : null}

        <Section>
          <Button onPress={onSignInPress} disabled={isLoading}>
            <HStack>
              <Spacer />
              {isLoading ? (
                <Text color="white">Signing in...</Text>
              ) : (
                <Text color="white">Continue</Text>
              )}
              <Spacer />
            </HStack>
          </Button>
        </Section>

        <Section>
          <HStack>
            <Spacer />
            <Text color="secondary">Don't have an account? </Text>
            <Link href="/sign-up" asChild>
              <Button>
                <Text color="blue">Sign up</Text>
              </Button>
            </Link>
            <Spacer />
          </HStack>
        </Section>
      </Form>
    </Host>
  );
}
