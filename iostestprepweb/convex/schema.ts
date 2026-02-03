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
  // EXAMS TABLE
  // ============================================
  exams: defineTable({
    // Basic info
    name: v.string(), // "SMLE", "SDLE", "SPLE", etc.
    description: v.string(), // "Saudi Medical Licensure Exam"
    category: v.union(
      v.literal("Medical"),
      v.literal("Law"),
      v.literal("IT"),
      v.literal("Language"),
      v.literal("Other")
    ),
    provider: v.string(), // "SCFHS", "Prometric", etc.
    country: v.string(), // "🇸🇦" or "Saudi Arabia"
    icon: v.optional(v.string()), // URL or emoji

    // Automatic counts (updated when questions/notes are added)
    active_question_count: v.number(),
    hy_notes_count: v.number(),

    // Status
    isActive: v.boolean(),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    schemaVersion: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_provider", ["provider"])
    .index("by_active", ["isActive"]),

  // ============================================
  // QUESTIONS TABLE
  // ============================================
  questions: defineTable({
    // Core question data
    q_text: v.string(), // "A 45-year-old man presents with..."
    q_image: v.optional(v.id("_storage")), // Question image (X-ray, ECG, etc.)

    choices: v.array(v.string()), // ["A. Option 1", "B. Option 2", ...]
    correct_choice_index: v.number(), // 0-based (0=A, 1=B, 2=C, 3=D)

    explanation: v.string(), // Why the answer is correct
    explanation_image: v.optional(v.id("_storage")), // Diagram/image for explanation
    source_of_answer: v.optional(v.string()), // "First Aid 2024, p.123" or URL

    // High-yield summary (one-liner for rapid review)
    hy_summary: v.string(), // "ACE inhibitors cause hyperkalemia and dry cough"

    // Categorization
    exam_id: v.id("exams"), // Link to exam (SMLE, SDLE, etc.)
    exam_name: v.optional(v.string()), // Denormalized exam name (optional for migration)
    subject: v.string(), // "Cardiology", "Pharmacology", "Anatomy"
    topic: v.string(), // "Heart Failure", "Beta Blockers", "Upper Limb"

    // AI generation metadata
    ai_generated: v.boolean(), // true if AI-generated
    ai_model: v.optional(v.string()), // "gpt-4o", "gemini-1.5-pro", "claude-3.5"
    ai_confidence: v.optional(v.number()), // 0-1 quality score from AI
    generation_prompt_id: v.optional(v.id("generation_prompts")), // Which prompt template

    // Quality control
    verified: v.boolean(), // Has been human-reviewed and approved

    // Source tracking
    source_type: v.union(
      v.literal("ai_generated"),
      v.literal("pdf_extracted"),
      v.literal("manual_entry"),
      v.literal("user_upload"),
      v.literal("telegram")
    ),
    source_file_id: v.optional(v.id("_storage")), // If from PDF upload

    // User feedback (embedded array)
    feedback: v.array(v.object({
      type: v.union(
        v.literal("wrong_answer"),
        v.literal("wrong_choice"),
        v.literal("bad_question"),
        v.literal("typo"),
        v.literal("unclear"),
        v.literal("duplicate"),
        v.literal("other")
      ),
      text: v.optional(v.string()), // User's explanation
      user_id: v.id("users"),
      timestamp: v.number(),
    })),

    // Status & metadata
    isActive: v.boolean(), // Is this question active/published?
    createdAt: v.number(),
    updatedAt: v.number(),
    schemaVersion: v.number(),
  })
    .index("by_exam", ["exam_id"])
    .index("by_exam_name", ["exam_name"]) // Filter by exam name
    .index("by_exam_and_subject", ["exam_id", "subject"])
    .index("by_exam_and_topic", ["exam_id", "topic"])
    .index("by_subject", ["subject"]) // Fast subject filtering
    .index("by_topic", ["topic"]) // Fast topic filtering
    .index("by_verified", ["verified"])
    .index("by_source_type", ["source_type"])
    .index("by_active", ["isActive"])
    .index("by_ai_generated", ["ai_generated"]),

  // ============================================
  // USER PROGRESS TABLE
  // ============================================
  user_progress: defineTable({
    // References
    user_id: v.id("users"),
    question_id: v.id("questions"),

    // Status
    status: v.union(
      v.literal("correct"),
      v.literal("incorrect"),
      v.literal("flagged"),
      v.literal("skipped")
    ),

    // Performance tracking
    attempts: v.number(), // Total attempts on this question
    correct_attempts: v.number(), // How many were correct
    time_spent_seconds: v.optional(v.number()), // Total time on this question

    // User's answer (for review)
    selected_choice_index: v.optional(v.number()), // Last selected answer

    // Metadata
    timestamp: v.number(), // First attempt
    last_attempt: v.number(), // Most recent attempt
  })
    .index("by_user", ["user_id"])
    .index("by_user_and_question", ["user_id", "question_id"])
    .index("by_status", ["user_id", "status"])
    .index("by_question", ["question_id"]),

  // ============================================
  // FLASHCARDS TABLE (Spaced Repetition)
  // ============================================
  flashcards: defineTable({
    // Reference
    user_id: v.id("users"),
    question_id: v.id("questions"), // Link to question

    // Spaced Repetition (SM-2 Algorithm)
    next_review: v.number(), // Timestamp when to review next
    interval: v.number(), // Days until next review (1, 3, 7, 14, 30...)
    ease_factor: v.number(), // Difficulty multiplier (2.5 default)
    repetitions: v.number(), // Successful reviews in a row

    // Status
    status: v.union(
      v.literal("new"),       // Never reviewed
      v.literal("learning"),  // In learning phase
      v.literal("review"),    // In review phase
      v.literal("relearning") // Failed, relearning
    ),

    // Metadata
    created_at: v.number(),
    last_reviewed: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_user_and_question", ["user_id", "question_id"])
    .index("by_next_review", ["user_id", "next_review"]) // Get due cards
    .index("by_status", ["user_id", "status"]),

  // ============================================
  // LIBRARY TABLE (Hierarchical Study Content)
  // ============================================
  library: defineTable({
    // Hierarchy
    parent_id: v.optional(v.id("library")), // null = root article
    type: v.union(
      v.literal("article"),   // Top level (HTN, Diabetes)
      v.literal("section"),   // Title (Definition, Treatment)
      v.literal("card")       // Individual point/card
    ),

    // Content
    title: v.string(), // "HTN", "Definition", "What is HTN?"
    content_md: v.optional(v.string()), // Markdown content

    // Media
    image_id: v.optional(v.id("_storage")),
    external_link: v.optional(v.string()),

    // Categorization
    exam_id: v.optional(v.id("exams")),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),

    // Relations
    related_question_ids: v.array(v.id("questions")),
    source: v.optional(v.string()), // "Harrison's 21st Ed, p.1234"

    // Metadata
    order: v.number(), // Display order within parent
    ai_generated: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_parent", ["parent_id", "order"]) // Get children in order
    .index("by_type", ["type"])
    .index("by_exam", ["exam_id"])
    .index("by_subject", ["subject"])
    .index("by_active", ["isActive"]),

  // ============================================
  // MOCK EXAMS TABLE (UWorld-style Practice Tests)
  // ============================================
  mock_exams: defineTable({
    // User & Exam
    user_id: v.id("users"),
    exam_id: v.id("exams"),

    // Test Configuration (UWorld-style)
    mode: v.union(
      v.literal("tutor"),      // Show answers immediately
      v.literal("timed"),      // Timed, no answers until end
      v.literal("untimed")     // Untimed, no answers until end
    ),

    // Question Selection Criteria
    selection_criteria: v.object({
      source: v.union(
        v.literal("all"),           // All questions
        v.literal("unused"),        // Never attempted
        v.literal("incorrect"),     // Previously incorrect
        v.literal("flagged"),       // Flagged questions
        v.literal("custom")         // Custom selection
      ),
      subjects: v.optional(v.array(v.string())), // Filter by subjects
      topics: v.optional(v.array(v.string())),   // Filter by topics
      question_count: v.number(),                 // Number of questions
    }),

    // Timer Settings
    has_timer: v.boolean(),
    time_limit_minutes: v.optional(v.number()), // Total exam time
    time_per_question_seconds: v.optional(v.number()), // Per question

    // Questions & Answers
    question_ids: v.array(v.id("questions")),
    answers: v.array(v.object({
      question_id: v.id("questions"),
      selected_choice_index: v.optional(v.number()),
      is_correct: v.optional(v.boolean()),
      time_spent_seconds: v.optional(v.number()),
      flagged: v.boolean(),
      marked_for_review: v.boolean(),
    })),

    // Results
    is_completed: v.boolean(),
    score_percentage: v.optional(v.number()),
    correct_count: v.optional(v.number()),
    incorrect_count: v.optional(v.number()),
    skipped_count: v.optional(v.number()),
    total_time_seconds: v.optional(v.number()),

    // Performance by Category (UWorld-style breakdown)
    performance_by_subject: v.optional(v.array(v.object({
      subject: v.string(),
      correct: v.number(),
      total: v.number(),
      percentage: v.number(),
    }))),

    // Metadata
    started_at: v.number(),
    completed_at: v.optional(v.number()),
    paused_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_user_and_exam", ["user_id", "exam_id"])
    .index("by_completed", ["user_id", "is_completed"])
    .index("by_mode", ["user_id", "mode"]),
});
