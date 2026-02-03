import { httpRouter } from "convex/server";
import { stripeWebhook, superwallWebhook } from "./webhooks";

const http = httpRouter();

// Stripe webhook endpoint
// Configure in Stripe Dashboard: https://your-convex-url.convex.site/stripe-webhook
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: stripeWebhook,
});

// Superwall webhook endpoint
// Configure in Superwall Dashboard: https://your-convex-url.convex.site/superwall-webhook
http.route({
  path: "/superwall-webhook",
  method: "POST",
  handler: superwallWebhook,
});

export default http;
