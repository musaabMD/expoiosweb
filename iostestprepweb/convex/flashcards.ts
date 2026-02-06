import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * SM-2 Algorithm Helper
 * Calculates next review interval based on user rating
 */
function calculateSM2(
    rating: "again" | "hard" | "good" | "easy",
    currentInterval: number,
    currentEaseFactor: number,
    currentRepetitions: number
): { interval: number; easeFactor: number; repetitions: number } {
    let interval = currentInterval;
    let easeFactor = currentEaseFactor;
    let repetitions = currentRepetitions;

    if (rating === "again") {
        // Failed - restart
        interval = 1; // 1 day
        repetitions = 0;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
        // Passed - increase interval
        repetitions += 1;

        if (rating === "hard") {
            interval = interval * 1.2;
            easeFactor = Math.max(1.3, easeFactor - 0.15);
        } else if (rating === "good") {
            if (repetitions === 1) {
                interval = 1; // First review: 1 day
            } else if (repetitions === 2) {
                interval = 6; // Second review: 6 days
            } else {
                interval = interval * easeFactor;
            }
        } else if (rating === "easy") {
            if (repetitions === 1) {
                interval = 4; // First review: 4 days
            } else {
                interval = interval * easeFactor * 1.3;
            }
            easeFactor = Math.min(2.5, easeFactor + 0.15);
        }
    }

    return {
        interval: Math.round(interval),
        easeFactor: Math.round(easeFactor * 100) / 100,
        repetitions,
    };
}

/**
 * Add a question to flashcards
 */
export const createFlashcard = mutation({
    args: {
        question_id: v.id("questions"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Check if flashcard already exists
        const existing = await ctx.db
            .query("flashcards")
            .withIndex("by_user_and_question", (q) =>
                q.eq("user_id", userId).eq("question_id", args.question_id)
            )
            .unique();

        if (existing) {
            return { success: false, message: "Flashcard already exists" };
        }

        const now = Date.now();

        // Create new flashcard
        const flashcardId = await ctx.db.insert("flashcards", {
            user_id: userId,
            question_id: args.question_id,
            next_review: now, // Available immediately
            interval: 0,
            ease_factor: 2.5, // Default
            repetitions: 0,
            status: "new",
            created_at: now,
        });

        return { success: true, flashcard_id: flashcardId };
    },
});

/**
 * Review a flashcard with rating
 */
export const reviewFlashcard = mutation({
    args: {
        flashcard_id: v.id("flashcards"),
        rating: v.union(
            v.literal("again"),
            v.literal("hard"),
            v.literal("good"),
            v.literal("easy")
        ),
    },
    handler: async (ctx, args) => {
        const flashcard = await ctx.db.get(args.flashcard_id);
        if (!flashcard) {
            throw new Error("Flashcard not found");
        }

        const now = Date.now();

        // Calculate new values using SM-2
        const { interval, easeFactor, repetitions } = calculateSM2(
            args.rating,
            flashcard.interval,
            flashcard.ease_factor,
            flashcard.repetitions
        );

        // Calculate next review timestamp
        const nextReview = now + interval * 24 * 60 * 60 * 1000; // Convert days to ms

        // Determine new status
        let status: "new" | "learning" | "review" | "relearning" = "learning";
        if (args.rating === "again") {
            status = flashcard.repetitions > 0 ? "relearning" : "learning";
        } else if (repetitions >= 2) {
            status = "review";
        }

        // Update flashcard
        await ctx.db.patch(args.flashcard_id, {
            next_review: nextReview,
            interval,
            ease_factor: easeFactor,
            repetitions,
            status,
            last_reviewed: now,
        });

        return {
            success: true,
            next_review_in_days: interval,
            status,
        };
    },
});

/**
 * Get due flashcards (ready to review)
 */
export const getDueFlashcards = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const now = Date.now();
        const limit = args.limit ?? 50;

        // Get flashcards where next_review <= now
        const dueCards = await ctx.db
            .query("flashcards")
            .withIndex("by_next_review", (q) => q.eq("user_id", userId))
            .filter((q) => q.lte(q.field("next_review"), now))
            .take(limit);

        // Fetch associated questions
        const cardsWithQuestions = await Promise.all(
            dueCards.map(async (card) => {
                const question = await ctx.db.get(card.question_id);
                return {
                    ...card,
                    question,
                };
            })
        );

        return cardsWithQuestions;
    },
});

/**
 * Get flashcard statistics
 */
export const getFlashcardStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        const allCards = await ctx.db
            .query("flashcards")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            .collect();

        const now = Date.now();

        const stats = {
            total: allCards.length,
            new: allCards.filter((c) => c.status === "new").length,
            learning: allCards.filter((c) => c.status === "learning").length,
            review: allCards.filter((c) => c.status === "review").length,
            relearning: allCards.filter((c) => c.status === "relearning").length,
            due_today: allCards.filter((c) => c.next_review <= now).length,
        };

        return stats;
    },
});

/**
 * Get all user's flashcards
 */
export const getMyFlashcards = query({
    args: {
        status: v.optional(
            v.union(
                v.literal("new"),
                v.literal("learning"),
                v.literal("review"),
                v.literal("relearning")
            )
        ),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const limit = args.limit ?? 100;

        if (args.status) {
            return await ctx.db
                .query("flashcards")
                .withIndex("by_status", (q) =>
                    q.eq("user_id", userId).eq("status", args.status!)
                )
                .take(limit);
        } else {
            return await ctx.db
                .query("flashcards")
                .withIndex("by_user", (q) => q.eq("user_id", userId))
                .take(limit);
        }
    },
});

/**
 * Delete a flashcard
 */
export const deleteFlashcard = mutation({
    args: {
        flashcard_id: v.id("flashcards"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.flashcard_id);
        return { success: true };
    },
});

/**
 * Reset a flashcard (start over)
 */
export const resetFlashcard = mutation({
    args: {
        flashcard_id: v.id("flashcards"),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        await ctx.db.patch(args.flashcard_id, {
            next_review: now,
            interval: 0,
            ease_factor: 2.5,
            repetitions: 0,
            status: "new",
            last_reviewed: undefined,
        });

        return { success: true };
    },
});
