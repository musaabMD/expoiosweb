import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import React from 'react';
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
import { padding } from '@expo/ui/swift-ui/modifiers';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

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
        // Handle 2FA - redirect to verification screen or show code input
        setError('Two-factor authentication required. Check your email for a code.');
        // You could navigate to a 2FA verification screen here:
        // router.push('/verify-2fa');
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
        <Section header="Sign In" footer={error ? error : undefined}>
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
