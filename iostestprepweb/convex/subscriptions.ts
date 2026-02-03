import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import {
  platformValidator,
  subscriptionStatusValidator,
  planIntervalValidator,
  subscriptionEventTypeValidator,
  webhookProviderValidator,
} from "./schema";

// ============================================
// TYPE DEFINITIONS
// ============================================

type Platform = "web_stripe" | "ios_superwall" | "android_superwall";
type SubscriptionStatus = "active" | "canceled" | "past_due" | "expired" | "trialing" | "incomplete";
type PlanInterval = "month" | "year" | "lifetime";
type EventType = "created" | "renewed" | "canceled" | "expired" | "updated" | "payment_failed" | "refunded";
type WebhookProvider = "stripe" | "superwall";

// Computed subscription info returned to clients
export interface SubscriptionInfo {
  subscription: Doc<"subscriptions"> | null;
  isActive: boolean;
  isPremium: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  isExpiringSoon: boolean; // < 7 days
  willRenew: boolean;
  expiresAt: number | null;
  platform: Platform | null;
  status: SubscriptionStatus | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractClerkId(tokenIdentifier: string, subject: string): string {
  return tokenIdentifier.split("|")[1] || subject;
}

function computeSubscriptionInfo(subscription: Doc<"subscriptions"> | null): SubscriptionInfo {
  const now = Date.now();

  if (!subscription) {
    return {
      subscription: null,
      isActive: false,
      isPremium: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      isExpiringSoon: false,
      willRenew: false,
      expiresAt: null,
      platform: null,
      status: null,
    };
  }

  const msRemaining = Math.max(0, subscription.currentPeriodEnd - now);
  const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  // Subscription is active if marked active AND not expired
  const isReallyActive =
    subscription.isActive &&
    subscription.currentPeriodEnd > now &&
    (subscription.status === "active" || subscription.status === "trialing");

  return {
    subscription,
    isActive: isReallyActive,
    isPremium: isReallyActive,
    daysRemaining,
    hoursRemaining,
    isExpiringSoon: daysRemaining > 0 && daysRemaining < 7,
    willRenew: subscription.autoRenew && !subscription.cancelAt,
    expiresAt: subscription.currentPeriodEnd,
    platform: subscription.platform,
    status: subscription.status,
  };
}

// ============================================
// PUBLIC QUERIES
// ============================================

/**
 * Get the current user's active subscription with computed fields.
 * This is the primary query for checking subscription status.
 */
export const getMySubscription = query({
  args: {},
  handler: async (ctx): Promise<SubscriptionInfo> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return computeSubscriptionInfo(null);
    }

    const clerkId = extractClerkId(identity.tokenIdentifier, identity.subject);

    // Query for active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_active", (q) => q.eq("clerkId", clerkId).eq("isActive", true))
      .first();

    // If found but expired, we should mark it as expired
    // (this will be handled by the mutation, but we compute correctly here)
    return computeSubscriptionInfo(subscription);
  },
});

/**
 * Get all subscriptions for the current user (including expired).
 */
export const getMySubscriptionHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const clerkId = extractClerkId(identity.tokenIdentifier, identity.subject);

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .collect();

    return subscriptions.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get subscription events for the current user.
 */
export const getMySubscriptionEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const clerkId = extractClerkId(identity.tokenIdentifier, identity.subject);
    const limit = args.limit ?? 50;

    const events = await ctx.db
      .query("subscription_events")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .order("desc")
      .take(limit);

    return events;
  },
});

/**
 * Check if the current user has an active subscription.
 * Lightweight query for feature gating.
 */
export const hasActiveSubscription = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const clerkId = extractClerkId(identity.tokenIdentifier, identity.subject);

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_active", (q) => q.eq("clerkId", clerkId).eq("isActive", true))
      .first();

    if (!subscription) return false;

    // Double check it's not expired
    return subscription.currentPeriodEnd > Date.now();
  },
});

// ============================================
// PUBLIC MUTATIONS
// ============================================

/**
 * Validate and refresh subscription status on user login.
 * Checks if subscription is expired and updates accordingly.
 */
export const validateSubscriptionStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const clerkId = extractClerkId(identity.tokenIdentifier, identity.subject);
    const now = Date.now();

    // Find active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_active", (q) => q.eq("clerkId", clerkId).eq("isActive", true))
      .first();

    if (!subscription) {
      return computeSubscriptionInfo(null);
    }

    // Check if expired but still marked active
    if (subscription.currentPeriodEnd < now && subscription.isActive) {
      // Mark as expired
      await ctx.db.patch(subscription._id, {
        isActive: false,
        status: "expired",
        updatedAt: now,
      });

      // Log the event
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
        .unique();

      if (user) {
        await ctx.db.insert("subscription_events", {
          userId: user._id,
          subscriptionId: subscription._id,
          clerkId,
          eventType: "expired",
          platform: subscription.platform,
          previousStatus: subscription.status,
          newStatus: "expired",
          timestamp: now,
        });
      }

      return computeSubscriptionInfo({
        ...subscription,
        isActive: false,
        status: "expired",
      });
    }

    return computeSubscriptionInfo(subscription);
  },
});

// ============================================
// INTERNAL MUTATIONS (for webhooks)
// ============================================

/**
 * Check if a webhook event has already been processed.
 */
export const checkWebhookProcessed = internalQuery({
  args: {
    provider: webhookProviderValidator,
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhook_events")
      .withIndex("by_provider_and_event", (q) =>
        q.eq("provider", args.provider).eq("eventId", args.eventId)
      )
      .unique();

    return existing?.processed ?? false;
  },
});

/**
 * Record a webhook event for idempotency.
 */
export const recordWebhookEvent = internalMutation({
  args: {
    provider: webhookProviderValidator,
    eventId: v.string(),
    eventType: v.string(),
    rawPayload: v.optional(v.any()),
    processed: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already exists
    const existing = await ctx.db
      .query("webhook_events")
      .withIndex("by_provider_and_event", (q) =>
        q.eq("provider", args.provider).eq("eventId", args.eventId)
      )
      .unique();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        processed: args.processed,
        processedAt: args.processed ? now : undefined,
        error: args.error,
      });
      return existing._id;
    }

    // Create new
    return await ctx.db.insert("webhook_events", {
      provider: args.provider,
      eventId: args.eventId,
      eventType: args.eventType,
      rawPayload: args.rawPayload,
      processed: args.processed,
      processedAt: args.processed ? now : undefined,
      error: args.error,
      receivedAt: now,
    });
  },
});

/**
 * Create or update a subscription from webhook data.
 */
export const upsertSubscription = internalMutation({
  args: {
    clerkId: v.string(),
    platform: platformValidator,
    status: subscriptionStatusValidator,
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    superwallSubscriptionId: v.optional(v.string()),
    superwallOfferId: v.optional(v.string()),
    productId: v.string(),
    planInterval: planIntervalValidator,
    autoRenew: v.boolean(),
    webhookEventId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error(`User not found for clerkId: ${args.clerkId}`);
    }

    // Compute isActive
    const isActive =
      (args.status === "active" || args.status === "trialing") &&
      args.currentPeriodEnd > now;

    // Check for existing subscription by platform-specific ID
    let existingSubscription: Doc<"subscriptions"> | null = null;

    if (args.stripeSubscriptionId) {
      existingSubscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_stripe_subscription", (q) =>
          q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
        )
        .unique();
    } else if (args.superwallSubscriptionId) {
      existingSubscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_superwall_subscription", (q) =>
          q.eq("superwallSubscriptionId", args.superwallSubscriptionId)
        )
        .unique();
    }

    // Prepare subscription data
    const subscriptionData = {
      userId: user._id,
      clerkId: args.clerkId,
      platform: args.platform,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAt: args.cancelAt,
      canceledAt: args.canceledAt,
      trialEnd: args.trialEnd,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      stripePriceId: args.stripePriceId,
      superwallSubscriptionId: args.superwallSubscriptionId,
      superwallOfferId: args.superwallOfferId,
      productId: args.productId,
      planInterval: args.planInterval,
      autoRenew: args.autoRenew,
      isActive,
      updatedAt: now,
    };

    let subscriptionId: Id<"subscriptions">;
    let eventType: EventType;
    let previousStatus: SubscriptionStatus | undefined;

    if (existingSubscription) {
      // Update existing
      previousStatus = existingSubscription.status;
      await ctx.db.patch(existingSubscription._id, subscriptionData);
      subscriptionId = existingSubscription._id;
      eventType = "updated";
    } else {
      // Create new
      subscriptionId = await ctx.db.insert("subscriptions", {
        ...subscriptionData,
        createdAt: now,
      });
      eventType = "created";
    }

    // Log subscription event
    await ctx.db.insert("subscription_events", {
      userId: user._id,
      subscriptionId,
      clerkId: args.clerkId,
      eventType,
      platform: args.platform,
      previousStatus,
      newStatus: args.status,
      metadata: args.metadata,
      webhookEventId: args.webhookEventId,
      timestamp: now,
    });

    return subscriptionId;
  },
});

/**
 * Cancel a subscription.
 */
export const cancelSubscription = internalMutation({
  args: {
    stripeSubscriptionId: v.optional(v.string()),
    superwallSubscriptionId: v.optional(v.string()),
    cancelAt: v.optional(v.number()), // For scheduled cancellation
    cancelImmediately: v.optional(v.boolean()),
    webhookEventId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find subscription
    let subscription: Doc<"subscriptions"> | null = null;

    if (args.stripeSubscriptionId) {
      subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_stripe_subscription", (q) =>
          q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
        )
        .unique();
    } else if (args.superwallSubscriptionId) {
      subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_superwall_subscription", (q) =>
          q.eq("superwallSubscriptionId", args.superwallSubscriptionId)
        )
        .unique();
    }

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const previousStatus = subscription.status;
    const newStatus: SubscriptionStatus = args.cancelImmediately ? "canceled" : subscription.status;
    const isActive = args.cancelImmediately ? false : subscription.isActive;

    await ctx.db.patch(subscription._id, {
      status: newStatus,
      isActive,
      cancelAt: args.cancelAt,
      canceledAt: now,
      autoRenew: false,
      updatedAt: now,
    });

    // Log event
    await ctx.db.insert("subscription_events", {
      userId: subscription.userId,
      subscriptionId: subscription._id,
      clerkId: subscription.clerkId,
      eventType: "canceled",
      platform: subscription.platform,
      previousStatus,
      newStatus,
      metadata: args.metadata,
      webhookEventId: args.webhookEventId,
      timestamp: now,
    });

    return subscription._id;
  },
});

/**
 * Handle payment failure.
 */
export const handlePaymentFailed = internalMutation({
  args: {
    stripeSubscriptionId: v.optional(v.string()),
    superwallSubscriptionId: v.optional(v.string()),
    webhookEventId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find subscription
    let subscription: Doc<"subscriptions"> | null = null;

    if (args.stripeSubscriptionId) {
      subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_stripe_subscription", (q) =>
          q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
        )
        .unique();
    } else if (args.superwallSubscriptionId) {
      subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_superwall_subscription", (q) =>
          q.eq("superwallSubscriptionId", args.superwallSubscriptionId)
        )
        .unique();
    }

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const previousStatus = subscription.status;

    await ctx.db.patch(subscription._id, {
      status: "past_due",
      updatedAt: now,
    });

    // Log event
    await ctx.db.insert("subscription_events", {
      userId: subscription.userId,
      subscriptionId: subscription._id,
      clerkId: subscription.clerkId,
      eventType: "payment_failed",
      platform: subscription.platform,
      previousStatus,
      newStatus: "past_due",
      metadata: args.metadata,
      webhookEventId: args.webhookEventId,
      timestamp: now,
    });

    return subscription._id;
  },
});

/**
 * Expire subscriptions that have passed their end date.
 * Called by cron job.
 */
export const expireSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all subscriptions that are marked active but have expired
    const expiredSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_period_end")
      .filter((q) =>
        q.and(
          q.lt(q.field("currentPeriodEnd"), now),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    let expiredCount = 0;

    for (const subscription of expiredSubscriptions) {
      await ctx.db.patch(subscription._id, {
        isActive: false,
        status: "expired",
        updatedAt: now,
      });

      await ctx.db.insert("subscription_events", {
        userId: subscription.userId,
        subscriptionId: subscription._id,
        clerkId: subscription.clerkId,
        eventType: "expired",
        platform: subscription.platform,
        previousStatus: subscription.status,
        newStatus: "expired",
        timestamp: now,
      });

      expiredCount++;
    }

    return { expiredCount };
  },
});

// ============================================
// ADMIN QUERIES (for dashboard)
// ============================================

/**
 * Get all subscriptions with pagination.
 * Requires admin role check in production.
 */
export const getAllSubscriptions = query({
  args: {
    status: v.optional(subscriptionStatusValidator),
    platform: v.optional(platformValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin role check
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity || !isAdmin(identity)) throw new Error("Unauthorized");

    const limit = args.limit ?? 100;
    let subscriptions;

    if (args.status) {
      subscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(limit);
    } else {
      subscriptions = await ctx.db.query("subscriptions").take(limit);
    }

    // Filter by platform if specified
    if (args.platform) {
      return subscriptions.filter((s) => s.platform === args.platform);
    }

    return subscriptions;
  },
});

/**
 * Get subscription metrics.
 */
export const getSubscriptionMetrics = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Add admin role check

    const allSubscriptions = await ctx.db.query("subscriptions").collect();

    const metrics = {
      total: allSubscriptions.length,
      active: allSubscriptions.filter((s) => s.isActive).length,
      expired: allSubscriptions.filter((s) => s.status === "expired").length,
      canceled: allSubscriptions.filter((s) => s.status === "canceled").length,
      trialing: allSubscriptions.filter((s) => s.status === "trialing").length,
      byPlatform: {
        web_stripe: allSubscriptions.filter((s) => s.platform === "web_stripe").length,
        ios_superwall: allSubscriptions.filter((s) => s.platform === "ios_superwall").length,
        android_superwall: allSubscriptions.filter((s) => s.platform === "android_superwall").length,
      },
      byInterval: {
        month: allSubscriptions.filter((s) => s.planInterval === "month").length,
        year: allSubscriptions.filter((s) => s.planInterval === "year").length,
        lifetime: allSubscriptions.filter((s) => s.planInterval === "lifetime").length,
      },
    };

    return metrics;
  },
});

// ============================================
// USER-SPECIFIC QUERIES (by clerkId)
// ============================================

/**
 * Get subscription by Clerk ID (for server-side use).
 */
export const getSubscriptionByClerkId = internalQuery({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_active", (q) => q.eq("clerkId", args.clerkId).eq("isActive", true))
      .first();

    return computeSubscriptionInfo(subscription);
  },
});
