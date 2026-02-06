import { Redirect, Stack } from 'expo-router';
import { useConvexAuth } from 'convex/react';

export default function AuthRoutesLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Don't redirect while loading
  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href={'/'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
