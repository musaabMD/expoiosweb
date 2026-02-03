import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://equal-cattle-74.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
