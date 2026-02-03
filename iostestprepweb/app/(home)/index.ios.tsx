import { SignedIn, SignedOut, useUser, useClerk } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Platform } from 'react-native';
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
  const router = useRouter();

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

          <VStack spacing={16}>
            <Link href="/(auth)/sign-in" asChild>
              <Button>
                <HStack spacing={8}>
                  <Image systemName="person.fill" color="white" size={18} />
                  <Text color="white">Sign In</Text>
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
