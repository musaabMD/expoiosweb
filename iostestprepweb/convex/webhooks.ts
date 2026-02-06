import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================
// STRIPE WEBHOOK HANDLER
// ============================================

/**
 * Stripe webhook endpoint.
 *
 * Configure in Stripe Dashboard:
 * URL: https://your-convex-url.convex.site/stripe-webhook
 * Events to listen:
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 */
export const stripeWebhook = httpAction(async (ctx, request) => {
  // Get the raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  // TODO: Verify webhook signature in production
  // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  let event: StripeEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventId = event.id;
  const eventType = event.type;

  // Check for duplicate processing (idempotency)
  const alreadyProcessed = await ctx.runQuery(internal.subscriptions.checkWebhookProcessed, {
    provider: "stripe",
    eventId,
  });

  if (alreadyProcessed) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Record webhook receipt
    await ctx.runMutation(internal.subscriptions.recordWebhookEvent, {
      provider: "stripe",
      eventId,
      eventType,
      rawPayload: event,
      processed: false,
    });

    // Process based on event type
    switch (eventType) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as StripeSubscription;

        // Extract Convex user ID from metadata (set this when creating the subscription)
        const userId = subscription.metadata?.convex_user_id;

        if (!userId) {
          throw new Error("Missing convex_user_id in subscription metadata");
        }

        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId: userId as any, // Cast to Id<"users">
          platform: "web_stripe",
          status: mapStripeStatus(subscription.status),
          currentPeriodStart: subscription.current_period_start * 1000,
          currentPeriodEnd: subscription.current_period_end * 1000,
          cancelAt: subscription.cancel_at ? subscription.cancel_at * 1000 : undefined,
          canceledAt: subscription.canceled_at ? subscription.canceled_at * 1000 : undefined,
          trialEnd: subscription.trial_end ? subscription.trial_end * 1000 : undefined,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0]?.price?.id,
          productId: subscription.metadata?.product_id || "default",
          planInterval: mapStripeInterval(subscription.items.data[0]?.price?.recurring?.interval),
          autoRenew: !subscription.cancel_at_period_end,
          webhookEventId: eventId,
          metadata: { stripe_event: eventType },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as StripeSubscription;

        await ctx.runMutation(internal.subscriptions.cancelSubscription, {
          stripeSubscriptionId: subscription.id,
          cancelImmediately: true,
          webhookEventId: eventId,
          metadata: { stripe_event: eventType },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeInvoice;

        if (invoice.subscription) {
          await ctx.runMutation(internal.subscriptions.handlePaymentFailed, {
            stripeSubscriptionId: invoice.subscription as string,
            webhookEventId: eventId,
            metadata: { stripe_event: eventType, invoice_id: invoice.id },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Subscription renewals are handled by customer.subscription.updated
        // This is mainly for logging purposes
        break;
      }

      default:
        // Unhandled event type - still mark as processed
        break;
    }

    // Mark as processed
    await ctx.runMutation(internal.subscriptions.recordWebhookEvent, {
      provider: "stripe",
      eventId,
      eventType,
      processed: true,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Record error
    await ctx.runMutation(internal.subscriptions.recordWebhookEvent, {
      provider: "stripe",
      eventId,
      eventType,
      processed: false,
      error: errorMessage,
    });

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ============================================
// SUPERWALL WEBHOOK HANDLER
// ============================================

/**
 * Superwall webhook endpoint for iOS/Android subscriptions.
 *
 * Configure in Superwall Dashboard:
 * URL: https://your-convex-url.convex.site/superwall-webhook
 */
export const superwallWebhook = httpAction(async (ctx, request) => {
  const body = await request.text();

  // TODO: Verify webhook signature in production
  // const signature = request.headers.get("x-superwall-signature");

  let event: SuperwallEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventId = event.id || `superwall_${Date.now()}`;
  const eventType = event.event;

  // Check for duplicate processing
  const alreadyProcessed = await ctx.runQuery(internal.subscriptions.checkWebhookProcessed, {
    provider: "superwall",
    eventId,
  });

  if (alreadyProcessed) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Record webhook receipt
    await ctx.runMutation(internal.subscriptions.recordWebhookEvent, {
      provider: "superwall",
      eventId,
      eventType,
      rawPayload: event,
      processed: false,
    });

    // Extract Convex user ID from the event
    // Superwall sends user_id which should be set to Convex user ID in your app
    const userId = event.user?.id || event.user_id;

    if (!userId) {
      throw new Error("Missing user_id in Superwall event");
    }

    // Determine platform from device info
    const platform = event.device?.platform === "ios" ? "ios_superwall" : "android_superwall";

    switch (eventType) {
      case "subscription_start":
      case "transaction_complete":
      case "subscription_renew": {
        const subscription = event.subscription || event.product;

        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId: userId as any, // Cast to Id<"users">
          platform: platform as "ios_superwall" | "android_superwall",
          status: "active",
          currentPeriodStart: parseSuperwallDate(subscription?.purchase_date),
          currentPeriodEnd: parseSuperwallDate(subscription?.expiration_date),
          superwallSubscriptionId: subscription?.transaction_id || event.id,
          superwallOfferId: event.paywall?.identifier,
          productId: subscription?.product_id || "default",
          planInterval: mapSuperwallInterval(subscription?.subscription_period),
          autoRenew: subscription?.auto_renew_status !== false,
          webhookEventId: eventId,
          metadata: { superwall_event: eventType },
        });
        break;
      }

      case "subscription_cancel": {
        const subscription = event.subscription || event.product;

        await ctx.runMutation(internal.subscriptions.cancelSubscription, {
          superwallSubscriptionId: subscription?.transaction_id || event.id,
          cancelAt: parseSuperwallDate(subscription?.expiration_date),
          webhookEventId: eventId,
          metadata: { superwall_event: eventType },
        });
        break;
      }

      case "subscription_expire": {
        const subscription = event.subscription || event.product;

        await ctx.runMutation(internal.subscriptions.cancelSubscription, {
          superwallSubscriptionId: subscription?.transaction_id || event.id,
          cancelImmediately: true,
          webhookEventId: eventId,
          metadata: { superwall_event: eventType },
        });
        break;
      }

      case "transaction_fail":
      case "subscription_billing_retry": {
        const subscription = event.subscription || event.product;

        await ctx.runMutation(internal.subscriptions.handlePaymentFailed, {
          superwallSubscriptionId: subscription?.transaction_id || event.id,
          webhookEventId: eventId,
          metadata: { superwall_event: eventType },
        });
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    // Mark as processed
    await ctx.runMutation(internal.subscriptions.recordWebhookEvent, {
      provider: "superwall",
      eventId,
      eventType,
      processed: true,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await ctx.runMutation(internal.subscriptions.recordWebhookEvent, {
      provider: "superwall",
      eventId,
      eventType,
      processed: false,
      error: errorMessage,
    });

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapStripeStatus(status: string): "active" | "canceled" | "past_due" | "expired" | "trialing" | "incomplete" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "expired";
  }
}

function mapStripeInterval(interval?: string): "month" | "year" | "lifetime" {
  switch (interval) {
    case "month":
      return "month";
    case "year":
      return "year";
    default:
      return "month";
  }
}

function mapSuperwallInterval(period?: string): "month" | "year" | "lifetime" {
  if (!period) return "month";
  const lower = period.toLowerCase();
  if (lower.includes("year") || lower.includes("annual")) return "year";
  if (lower.includes("lifetime") || lower.includes("forever")) return "lifetime";
  return "month";
}

function parseSuperwallDate(dateString?: string | number): number {
  if (!dateString) return Date.now();
  if (typeof dateString === "number") return dateString;
  const parsed = Date.parse(dateString);
  return isNaN(parsed) ? Date.now() : parsed;
}

// ============================================
// TYPE DEFINITIONS (for Stripe/Superwall)
// ============================================

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at?: number;
  canceled_at?: number;
  cancel_at_period_end: boolean;
  trial_end?: number;
  metadata: Record<string, string>;
  items: {
    data: Array<{
      price?: {
        id: string;
        recurring?: {
          interval: string;
        };
      };
    }>;
  };
}

interface StripeInvoice {
  id: string;
  subscription?: string;
}

interface SuperwallEvent {
  id?: string;
  event: string;
  user?: {
    id: string;
  };
  user_id?: string;
  device?: {
    platform: string;
  };
  subscription?: {
    transaction_id?: string;
    product_id?: string;
    purchase_date?: string;
    expiration_date?: string;
    subscription_period?: string;
    auto_renew_status?: boolean;
  };
  product?: {
    transaction_id?: string;
    product_id?: string;
    purchase_date?: string;
    expiration_date?: string;
    subscription_period?: string;
    auto_renew_status?: boolean;
  };
  paywall?: {
    identifier?: string;
  };
}
