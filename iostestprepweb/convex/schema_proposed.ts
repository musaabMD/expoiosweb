import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * COMPLETE CONVEX SCHEMA FOR AI-DRIVEN TEST PREP APP
 * 
 * RELATIONSHIP DIAGRAM:
 * 
 * users (Clerk auth)
 *   ├─→ subscriptions (1:many)
 *   ├─→ user_progress (1:many)
 *   ├─→ mock_exams (1:many)
 *   ├─→ flashcards (1:many)
 *   └─→ pdf_uploads (1:many)
 * 
 * exams
 *   ├─→ questions (1:many)
 *   ├─→ hy_notes (1:many)
 *   ├─→ flashcards (1:many)
 *   └─→ mock_exams (1:many)
 * 
 * questions
 *   ├─→ hy_notes (1:1)
 *   ├─→ flashcards (1:many, per user)
 *   ├─→ user_progress (1:many, per user)
 *   └─→ library.related_question_ids (many:many)
 * 
 * generation_prompts
 *   └─→ questions.generation_prompt_id (1:many)
 * 
 * pdf_uploads
 *   └─→ questions.source_file_id (1:many)
 */

export default defineSchema({
    // ============================================
    // CORE CONTENT TABLES
    // ============================================

    /**
     * EXAMS TABLE
     * Top-level exam categories (USMLE, SMLE, TOEFL, etc.)
     * 
     * Relationships:
     * - Has many: questions, hy_notes, flashcards, mock_exams
     * - Counts calculated dynamically via queries (not stored)
     */
    exams: defineTable({
        name: v.string(), // "USMLE Step 1", "SMLE", "TOEFL"
        category: v.union(
            v.literal("Medical"),
            v.literal("Law"),
            v.literal("IT"),
            v.literal("Language"),
            v.literal("Other")
        ),
        country: v.optional(v.string()), // "USA", "Saudi Arabia"
        description: v.optional(v.string()),
        icon: v.optional(v.string()), // URL or emoji

        // Metadata
        isActive: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
        schemaVersion: v.number(), // For safe migrations
    })
        .index("by_category", ["category"])
        .index("by_active", ["isActive"]),

    /**
     * QUESTIONS TABLE
     * Core question bank with AI generation support
     * 
     * Relationships:
     * - Belongs to: exams (via exam_id)
     * - Belongs to: generation_prompts (via generation_prompt_id)
     * - Belongs to: pdf_uploads (via source_file_id)
     * - Has one: hy_notes
     * - Has many: flashcards (per user), user_progress (per user)
     * - Referenced by: library.related_question_ids
     */
    questions: defineTable({
        // Core question data
        q_text: v.string(), // "A 45-year-old man presents with..."
        choices: v.array(v.string()), // ["A. Option 1", "B. Option 2", ...]
        correct_choice_index: v.number(), // 0-based index (0 = A, 1 = B, etc.)
        explanation: v.string(), // Why the answer is correct
        source_of_answer: v.optional(v.string()), // "First Aid 2024, p.123" or URL

        // Categorization
        exam_id: v.id("exams"), // Foreign key to exams
        subject: v.string(), // "Cardiology", "Grammar", etc.
        topic: v.string(), // "Heart Failure", "Present Perfect", etc.

        // AI metadata
        ai_generated: v.boolean(), // true if AI-generated
        ai_model: v.optional(v.string()), // "gpt-4o", "gemini-1.5-pro", etc.
        ai_confidence: v.optional(v.number()), // 0-1 quality score
        generation_prompt_id: v.optional(v.id("generation_prompts")), // Which prompt was used

        // Quality control
        verified: v.boolean(), // Has been human-reviewed
        difficulty: v.optional(v.union(
            v.literal("easy"),
            v.literal("medium"),
            v.literal("hard")
        )),

        // Source tracking
        source_type: v.union(
            v.literal("ai_generated"),
            v.literal("pdf_extracted"),
            v.literal("manual_entry"),
            v.literal("user_upload")
        ),
        source_file_id: v.optional(v.id("_storage")), // If extracted from PDF

        // Metadata
        createdAt: v.number(),
        updatedAt: v.number(),
        schemaVersion: v.number(),
    })
        .index("by_exam", ["exam_id"])
        .index("by_exam_and_subject", ["exam_id", "subject"])
        .index("by_exam_and_topic", ["exam_id", "topic"])
        .index("by_verified", ["verified"])
        .index("by_source_type", ["source_type"])
        .index("by_ai_generated", ["ai_generated"]),

    /**
     * HIGH-YIELD NOTES TABLE
     * One-line summaries of must-know facts
     * 
     * Relationships:
     * - Belongs to: exams (via exam_id)
     * - Belongs to: questions (via question_id) - 1:1 relationship
     * 
     * AI Automation: Auto-generated when question is created
     */
    hy_notes: defineTable({
        one_line_summary: v.string(), // "ACE inhibitors cause hyperkalemia"
        exam_id: v.id("exams"),
        subject: v.string(),
        topic: v.string(),
        question_id: v.id("questions"), // Source question (1:1)

        // AI metadata
        ai_generated: v.boolean(),
        ai_model: v.optional(v.string()),

        // Metadata
        createdAt: v.number(),
        schemaVersion: v.number(),
    })
        .index("by_exam", ["exam_id"])
        .index("by_question", ["question_id"]) // Unique per question
        .index("by_topic", ["exam_id", "topic"]),

    /**
     * FLASHCARDS TABLE
     * Spaced repetition system (Anki-style)
     * 
     * Relationships:
     * - Belongs to: exams (via exam_id)
     * - Belongs to: questions (via question_id)
     * - Belongs to: users (via user_id)
     * 
     * Note: Each user has their own flashcard instance per question
     * AI Automation: Auto-created from question + HY note
     */
    flashcards: defineTable({
        exam_id: v.id("exams"),
        question_id: v.id("questions"),

        // Card content
        front: v.string(), // Question or prompt
        back: v.string(), // Answer or HY summary

        // Spaced repetition data (per user)
        user_id: v.id("users"),
        next_review: v.number(), // Timestamp for next review
        interval: v.number(), // Days until next review
        ease_factor: v.number(), // Difficulty multiplier (default 2.5)
        repetitions: v.number(), // How many times reviewed

        // Metadata
        createdAt: v.number(),
        lastReviewed: v.optional(v.number()),
        schemaVersion: v.number(),
    })
        .index("by_user", ["user_id"])
        .index("by_user_and_exam", ["user_id", "exam_id"])
        .index("by_next_review", ["user_id", "next_review"]) // For "due today" queries
        .index("by_question", ["question_id"]),

    /**
     * LIBRARY TABLE
     * Long-form educational content (Amboss-style articles)
     * 
     * Relationships:
     * - References: questions (via related_question_ids) - many:many
     */
    library: defineTable({
        title: v.string(), // "Heart Failure Management"
        content_md: v.string(), // Full markdown content
        subject: v.string(),
        category: v.string(),
        related_question_ids: v.array(v.id("questions")), // Linked questions

        // AI metadata
        ai_generated: v.boolean(),
        ai_model: v.optional(v.string()),

        // Metadata
        createdAt: v.number(),
        updatedAt: v.number(),
        schemaVersion: v.number(),
    })
        .index("by_subject", ["subject"])
        .index("by_category", ["category"]),

    // ============================================
    // USER INTERACTION TABLES
    // ============================================

    /**
     * USER PROGRESS TABLE
     * Tracks user's performance on individual questions
     * 
     * Relationships:
     * - Belongs to: users (via user_id)
     * - Belongs to: questions (via question_id)
     * 
     * Note: One record per user per question (can have multiple attempts)
     */
    user_progress: defineTable({
        user_id: v.id("users"),
        question_id: v.id("questions"),

        status: v.union(
            v.literal("correct"),
            v.literal("incorrect"),
            v.literal("flagged"),
            v.literal("skipped")
        ),

        // Performance tracking
        attempts: v.number(), // Total attempts
        correct_attempts: v.number(), // How many were correct
        time_spent_seconds: v.optional(v.number()), // Total time on this question

        // Metadata
        timestamp: v.number(), // First attempt
        last_attempt: v.number(), // Most recent attempt
    })
        .index("by_user", ["user_id"])
        .index("by_user_and_question", ["user_id", "question_id"])
        .index("by_status", ["user_id", "status"]),

    /**
     * MOCK EXAMS TABLE
     * User's practice exams with results
     * 
     * Relationships:
     * - Belongs to: users (via user_id)
     * - Belongs to: exams (via exam_id)
     * - References: questions (via question_ids array)
     */
    mock_exams: defineTable({
        user_id: v.id("users"),
        exam_id: v.id("exams"),

        // Exam configuration
        question_ids: v.array(v.id("questions")), // Selected questions
        time_limit_minutes: v.optional(v.number()),

        // Results
        is_completed: v.boolean(),
        score: v.optional(v.number()), // Percentage (0-100)
        correct_count: v.optional(v.number()),
        total_count: v.number(),
        time_taken_seconds: v.optional(v.number()),

        // Metadata
        started_at: v.number(),
        completed_at: v.optional(v.number()),
    })
        .index("by_user", ["user_id"])
        .index("by_user_and_exam", ["user_id", "exam_id"])
        .index("by_completed", ["user_id", "is_completed"]),

    // ============================================
    // AI GENERATION TABLES
    // ============================================

    /**
     * GENERATION PROMPTS TABLE
     * Library of AI prompts with performance tracking
     * 
     * Relationships:
     * - Referenced by: questions.generation_prompt_id
     * 
     * Purpose: Store and optimize prompts over time
     */
    generation_prompts: defineTable({
        name: v.string(), // "USMLE Cardiology v2"
        prompt_template: v.string(), // Full prompt with {placeholders}
        model: v.string(), // "gpt-4o", "gemini-1.5-pro"

        // Performance tracking
        success_rate: v.optional(v.number()), // 0-1
        avg_quality_score: v.optional(v.number()), // 0-1
        total_generations: v.number(),

        // Metadata
        isActive: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_active", ["isActive"])
        .index("by_model", ["model"]),

    /**
     * PDF UPLOADS TABLE
     * User-uploaded files for question extraction
     * 
     * Relationships:
     * - Belongs to: users (via user_id)
     * - References: _storage (via file_id)
     * - Referenced by: questions.source_file_id
     */
    pdf_uploads: defineTable({
        user_id: v.id("users"),
        file_id: v.id("_storage"), // Convex file storage
        filename: v.string(),

        // Processing status
        status: v.union(
            v.literal("uploaded"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed")
        ),

        // Extraction results
        extracted_text: v.optional(v.string()), // Full text content
        generated_question_ids: v.optional(v.array(v.id("questions"))),
        error_message: v.optional(v.string()),

        // Metadata
        uploaded_at: v.number(),
        processed_at: v.optional(v.number()),
    })
        .index("by_user", ["user_id"])
        .index("by_status", ["status"]),

    // ============================================
    // USER & SUBSCRIPTION TABLES (EXISTING)
    // ============================================

    /**
     * USERS TABLE
     * User accounts synced from Clerk
     * 
     * Relationships:
     * - Has many: subscriptions, user_progress, mock_exams, flashcards, pdf_uploads
     */
    users: defineTable({
        clerkId: v.string(), // Clerk user ID
        email: v.string(),
        name: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_clerkId", ["clerkId"])
        .index("by_email", ["email"]),

    /**
     * SUBSCRIPTIONS TABLE
     * Multi-platform subscription management
     * 
     * Relationships:
     * - Belongs to: users (via userId)
     */
    subscriptions: defineTable({
        userId: v.id("users"),
        clerkId: v.string(), // Denormalized for faster lookups

        platform: v.union(
            v.literal("web_stripe"),
            v.literal("ios_superwall"),
            v.literal("android_superwall")
        ),

        status: v.union(
            v.literal("active"),
            v.literal("canceled"),
            v.literal("past_due"),
            v.literal("expired"),
            v.literal("trialing"),
            v.literal("incomplete")
        ),

        currentPeriodStart: v.number(),
        currentPeriodEnd: v.number(),
        cancelAt: v.optional(v.number()),
        canceledAt: v.optional(v.number()),
        trialEnd: v.optional(v.number()),

        // Stripe-specific
        stripeSubscriptionId: v.optional(v.string()),
        stripeCustomerId: v.optional(v.string()),
        stripePriceId: v.optional(v.string()),

        // Superwall-specific
        superwallSubscriptionId: v.optional(v.string()),
        superwallOfferId: v.optional(v.string()),

        productId: v.string(),
        planInterval: v.union(
            v.literal("month"),
            v.literal("year"),
            v.literal("lifetime")
        ),

        autoRenew: v.boolean(),
        isActive: v.boolean(),
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

    /**
     * SUBSCRIPTION EVENTS TABLE
     * Audit trail for subscription changes
     * 
     * Relationships:
     * - Belongs to: users (via userId)
     * - Belongs to: subscriptions (via subscriptionId)
     */
    subscription_events: defineTable({
        userId: v.id("users"),
        subscriptionId: v.id("subscriptions"),
        clerkId: v.string(),

        eventType: v.union(
            v.literal("created"),
            v.literal("renewed"),
            v.literal("canceled"),
            v.literal("expired"),
            v.literal("updated"),
            v.literal("payment_failed"),
            v.literal("refunded")
        ),

        platform: v.union(
            v.literal("web_stripe"),
            v.literal("ios_superwall"),
            v.literal("android_superwall")
        ),

        previousStatus: v.optional(v.union(
            v.literal("active"),
            v.literal("canceled"),
            v.literal("past_due"),
            v.literal("expired"),
            v.literal("trialing"),
            v.literal("incomplete")
        )),

        newStatus: v.union(
            v.literal("active"),
            v.literal("canceled"),
            v.literal("past_due"),
            v.literal("expired"),
            v.literal("trialing"),
            v.literal("incomplete")
        ),

        metadata: v.optional(v.any()),
        webhookEventId: v.optional(v.string()),
        timestamp: v.number(),
    })
        .index("by_user_id", ["userId"])
        .index("by_subscription_id", ["subscriptionId"])
        .index("by_clerk_id", ["clerkId"])
        .index("by_timestamp", ["timestamp"])
        .index("by_webhook_event", ["webhookEventId"]),

    /**
     * WEBHOOK EVENTS TABLE
     * Idempotency tracking for webhooks
     */
    webhook_events: defineTable({
        provider: v.union(v.literal("stripe"), v.literal("superwall")),
        eventId: v.string(),
        eventType: v.string(),
        processed: v.boolean(),
        processedAt: v.optional(v.number()),
        rawPayload: v.optional(v.any()),
        error: v.optional(v.string()),
        receivedAt: v.number(),
    })
        .index("by_provider_and_event", ["provider", "eventId"])
        .index("by_processed", ["processed"]),
});
