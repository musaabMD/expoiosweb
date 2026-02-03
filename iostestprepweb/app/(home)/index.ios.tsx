import { SignedIn, SignedOut, useUser, useClerk, useSSO } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import { background, clipShape, frame, padding } from '@expo/ui/swift-ui/modifiers';

export default function HomePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
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

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <Host style={{ flex: 1 }}>
      <SignedIn>
        <Form>
          <Section header="Account">
            <VStack spacing={16}>
              <HStack spacing={12}>
                <Image
                  systemName="person.circle.fill"
                  color="blue"
                  size={48}
                />
                <VStack>
                  <Text size={18} weight="semibold">Welcome!</Text>
                  <Text size={14} color="secondary">
                    {user?.emailAddresses[0]?.emailAddress}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Section>

          <Section header="Actions">
            <Button onPress={handleSignOut}>
              <HStack spacing={8}>
                <Image
                  systemName="rectangle.portrait.and.arrow.right"
                  color="white"
                  size={18}
                  modifiers={[
                    frame({ width: 28, height: 28 }),
                    background('#FF3B30'),
                    clipShape('roundedRectangle'),
                  ]}
                />
                <Text color="red">Sign Out</Text>
                <Spacer />
                <Image systemName="chevron.right" size={14} color="secondary" />
              </HStack>
            </Button>
          </Section>
        </Form>
      </SignedIn>

      <SignedOut>
        <VStack spacing={32} modifiers={[padding({ all: 32 })]}>
          <VStack spacing={8}>
            <Image
              systemName="books.vertical.fill"
              color="blue"
              size={64}
            />
            <Text size={28} weight="bold">TestPrep2026</Text>
            <Text size={16} color="secondary">Your study companion</Text>
          </VStack>

          <VStack spacing={12}>
            <Button onPress={onGooglePress}>
              <HStack spacing={8}>
                <Spacer />
                <Text>Continue with Google</Text>
                <Spacer />
              </HStack>
            </Button>

            <Button onPress={onApplePress}>
              <HStack spacing={8}>
                <Spacer />
                <Image systemName="apple.logo" color="white" size={18} />
                <Text color="white">Continue with Apple</Text>
                <Spacer />
              </HStack>
            </Button>
          </VStack>

          <VStack spacing={16}>
            <Text size={14} color="secondary">or sign in with email</Text>

            <Link href="/(auth)/sign-in" asChild>
              <Button>
                <HStack spacing={8}>
                  <Image systemName="envelope.fill" color="blue" size={18} />
                  <Text color="blue">Sign In with Email</Text>
                </HStack>
              </Button>
            </Link>

            <Link href="/(auth)/sign-up" asChild>
              <Button>
                <HStack spacing={8}>
                  <Image systemName="person.badge.plus" color="blue" size={18} />
                  <Text color="blue">Create Account</Text>
                </HStack>
              </Button>
            </Link>
          </VStack>
        </VStack>
      </SignedOut>
    </Host>
  );
}
