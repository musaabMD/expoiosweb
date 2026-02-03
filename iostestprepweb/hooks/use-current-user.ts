import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

/**
 * Hook to get the current authenticated user from Convex database.
 * Returns null if not authenticated or user not found.
 */
export function useCurrentUser() {
  const user = useQuery(api.users.getCurrentUser);
  return user;
}
