import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { AppState, AppStateStatus } from "react-native";
import { api } from "../convex/_generated/api";

/**
 * Component that syncs the authenticated user to Convex.
 * Should be placed inside ConvexProviderWithClerk.
 * Automatically stores/updates user in Convex database when authenticated.
 * Also validates subscription status on login and app foreground.
 */
export function UserSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);
  const validateSubscription = useMutation(api.subscriptions.validateSubscriptionStatus);
  const appState = useRef(AppState.currentState);

  // Sync user and validate subscription on authentication
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Store/update user in Convex when authenticated
      storeUser()
        .then(() => {
          // After user is synced, validate subscription status
          return validateSubscription();
        })
        .catch((error) => {
          console.error("Failed to sync user to Convex:", error);
        });
    }
  }, [isAuthenticated, isLoading, storeUser, validateSubscription]);

  // Validate subscription when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active" &&
          isAuthenticated
        ) {
          // App has come to the foreground, validate subscription
          validateSubscription().catch((error) => {
            console.error("Failed to validate subscription:", error);
          });
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, validateSubscription]);

  return <>{children}</>;
}
