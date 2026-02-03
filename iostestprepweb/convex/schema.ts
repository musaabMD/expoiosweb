import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Subscription platform types
export const platformValidator = v.union(
  v.literal("web_stripe"),
  v.literal("ios_superwall"),
  v.literal("android_superwall")
);

// Subscription status types
export const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("canceled"),
  v.literal("past_due"),
  v.literal("expired"),
  v.literal("trialing"),
  v.literal("incomplete")
);

// Plan interval types
export const planIntervalValidator = v.union(
  v.literal("month"),
  v.literal("year"),
  v.literal("lifetime")
);

// Subscription event types
export const subscriptionEventTypeValidator = v.union(
  v.literal("created"),
  v.literal("renewed"),
  v.literal("canceled"),
  v.literal("expired"),
  v.literal("updated"),
  v.literal("payment_failed"),
  v.literal("refunded")
);

// Webhook provider types
export const webhookProviderValidator = v.union(
  v.literal("stripe"),
  v.literal("superwall")
);

export default defineSchema({
  // ============================================
  // USERS TABLE (existing)
  // ============================================
  users: defineTable({
    // Clerk user ID (from tokenIdentifier)
    clerkId: v.string(),
    // User profile information from Clerk
    email: v.string(),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  // ============================================
  // SUBSCRIPTIONS TABLE
  // ============================================
  subscriptions: defineTable({
    // User references
    userId: v.id("users"),
    clerkId: v.string(), // Denormalized for faster lookups

    // Platform info
    platform: platformValidator,

    // Subscription status
    status: subscriptionStatusValidator,

    // Period tracking
    currentPeriodStart: v.number(), // timestamp
    currentPeriodEnd: v.number(), // timestamp

    // Cancellation tracking
    cancelAt: v.optional(v.number()), // scheduled cancellation
    canceledAt: v.optional(v.number()), // when canceled

    // Trial tracking
    trialEnd: v.optional(v.number()),

    // Stripe-specific fields
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),

    // Superwall-specific fields
    superwallSubscriptionId: v.optional(v.string()),
    superwallOfferId: v.optional(v.string()),

    // Plan details
    productId: v.string(), // Your internal product SKU
    planInterval: planIntervalValidator,

    // Flags
    autoRenew: v.boolean(),
    isActive: v.boolean(), // Computed helper field for fast queries

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_superwall_subscription", ["superwallSubscriptionId"])
    .index("by_status", ["status"])
    .index("by_active", ["clerkId", "isActive"])
    .index("by_period_end", ["currentPeriodEnd", "isActive"]),

  // ============================================
  // SUBSCRIPTION EVENTS TABLE (Audit Trail)
  // ============================================
  subscription_events: defineTable({
    // References
    userId: v.id("users"),
    subscriptionId: v.id("subscriptions"),
    clerkId: v.string(), // Denormalized

    // Event details
    eventType: subscriptionEventTypeValidator,
    platform: platformValidator,

    // Status transition
    previousStatus: v.optional(subscriptionStatusValidator),
    newStatus: subscriptionStatusValidator,

    // Metadata
    metadata: v.optional(v.any()), // Store webhook data
    webhookEventId: v.optional(v.string()), // For idempotency

    // Timestamp
    timestamp: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_subscription_id", ["subscriptionId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_webhook_event", ["webhookEventId"]),

  // ============================================
  // WEBHOOK EVENTS TABLE (Idempotency)
  // ============================================
  webhook_events: defineTable({
    // Provider info
    provider: webhookProviderValidator,
    eventId: v.string(), // Unique event ID from provider
    eventType: v.string(),

    // Processing status
    processed: v.boolean(),
    processedAt: v.optional(v.number()),

    // Raw data
    rawPayload: v.optional(v.any()),
    error: v.optional(v.string()),

    // Timestamp
    receivedAt: v.number(),
  })
    .index("by_provider_and_event", ["provider", "eventId"])
    .index("by_processed", ["processed"]),

  // ============================================
  // TASKS TABLE (existing)
  // ============================================
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    userId: v.optional(v.id("users")),
  }).index("by_userId", ["userId"]),
});
