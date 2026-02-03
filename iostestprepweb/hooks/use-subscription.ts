import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

/**
 * Hook to get the current user's subscription status.
 * Returns computed fields for easy access to subscription state.
 */
export function useSubscription() {
  const subscription = useQuery(api.subscriptions.getMySubscription);

  return subscription;
}

/**
 * Hook to check if user has active subscription (lightweight).
 */
export function useHasSubscription() {
  const hasSubscription = useQuery(api.subscriptions.hasActiveSubscription);
  return hasSubscription ?? false;
}

/**
 * Hook to get subscription history.
 */
export function useSubscriptionHistory() {
  const history = useQuery(api.subscriptions.getMySubscriptionHistory);
  return history ?? [];
}

/**
 * Hook to get subscription events.
 */
export function useSubscriptionEvents(limit?: number) {
  const events = useQuery(api.subscriptions.getMySubscriptionEvents, {
    limit,
  });
  return events ?? [];
}

/**
 * Hook to validate/refresh subscription status.
 * Call this on app foreground or after returning from payment flow.
 */
export function useValidateSubscription() {
  const validateSubscription = useMutation(
    api.subscriptions.validateSubscriptionStatus
  );

  return validateSubscription;
}

/**
 * Helper hook for premium feature gating.
 * Returns simple boolean and loading state.
 */
export function usePremiumAccess() {
  const subscription = useSubscription();

  return {
    isPremium: subscription?.isPremium ?? false,
    isLoading: subscription === undefined,
    daysRemaining: subscription?.daysRemaining ?? 0,
    isExpiringSoon: subscription?.isExpiringSoon ?? false,
  };
}
