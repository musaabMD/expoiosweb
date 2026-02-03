import * as React from 'react';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
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

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError('');

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err?.errors?.[0]?.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError('');

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err?.errors?.[0]?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <Host style={{ flex: 1 }}>
        <Form>
          <Section
            header="Verify Your Email"
            footer={error ? error : "We sent a verification code to your email"}
          >
            <VStack spacing={16}>
              <HStack spacing={8}>
                <Image systemName="number.circle.fill" color="gray" size={20} />
                <TextField
                  placeholder="Verification code"
                  text={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                />
              </HStack>
            </VStack>
          </Section>

          <Section>
            <Button onPress={onVerifyPress} disabled={isLoading}>
              <HStack>
                <Spacer />
                {isLoading ? (
                  <Text color="white">Verifying...</Text>
                ) : (
                  <Text color="white">Verify Email</Text>
                )}
                <Spacer />
              </HStack>
            </Button>
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section header="Create Account" footer={error ? error : undefined}>
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
          <Button onPress={onSignUpPress} disabled={isLoading}>
            <HStack>
              <Spacer />
              {isLoading ? (
                <Text color="white">Creating account...</Text>
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
            <Text color="secondary">Already have an account? </Text>
            <Link href="/sign-in" asChild>
              <Button>
                <Text color="blue">Sign in</Text>
              </Button>
            </Link>
            <Spacer />
          </HStack>
        </Section>
      </Form>
    </Host>
  );
}
