import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Record user's answer to a question
 */
export const recordAnswer = mutation({
    args: {
        question_id: v.id("questions"),
        selected_choice_index: v.number(),
        is_correct: v.boolean(),
        time_spent_seconds: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const clerkId = identity.tokenIdentifier.split("|")[1] || identity.subject;
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const now = Date.now();

        // Check if progress already exists
        const existing = await ctx.db
            .query("user_progress")
            .withIndex("by_user_and_question", (q) =>
                q.eq("user_id", user._id).eq("question_id", args.question_id)
            )
            .unique();

        if (existing) {
            // Update existing progress
            await ctx.db.patch(existing._id, {
                status: args.is_correct ? "correct" : "incorrect",
                attempts: existing.attempts + 1,
                correct_attempts: existing.correct_attempts + (args.is_correct ? 1 : 0),
                time_spent_seconds: args.time_spent_seconds
                    ? (existing.time_spent_seconds || 0) + args.time_spent_seconds
                    : existing.time_spent_seconds,
                selected_choice_index: args.selected_choice_index,
                last_attempt: now,
            });

            return { success: true, progress_id: existing._id };
        } else {
            // Create new progress record
            const progressId = await ctx.db.insert("user_progress", {
                user_id: user._id,
                question_id: args.question_id,
                status: args.is_correct ? "correct" : "incorrect",
                attempts: 1,
                correct_attempts: args.is_correct ? 1 : 0,
                time_spent_seconds: args.time_spent_seconds,
                selected_choice_index: args.selected_choice_index,
                timestamp: now,
                last_attempt: now,
            });

            return { success: true, progress_id: progressId };
        }
    },
});

/**
 * Flag a question for review
 */
export const flagQuestion = mutation({
    args: {
        question_id: v.id("questions"),
        flagged: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const clerkId = identity.tokenIdentifier.split("|")[1] || identity.subject;
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const now = Date.now();

        // Check if progress exists
        const existing = await ctx.db
            .query("user_progress")
            .withIndex("by_user_and_question", (q) =>
                q.eq("user_id", user._id).eq("question_id", args.question_id)
            )
            .unique();

        if (existing) {
            // Update flag status
            await ctx.db.patch(existing._id, {
                status: args.flagged ? "flagged" : existing.status,
                last_attempt: now,
            });
        } else {
            // Create new progress record with flagged status
            await ctx.db.insert("user_progress", {
                user_id: user._id,
                question_id: args.question_id,
                status: "flagged",
                attempts: 0,
                correct_attempts: 0,
                timestamp: now,
                last_attempt: now,
            });
        }

        return { success: true };
    },
});

/**
 * Get user's progress on all questions
 */
export const getMyProgress = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const clerkId = identity.tokenIdentifier.split("|")[1] || identity.subject;
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (!user) {
            return [];
        }

        const limit = args.limit ?? 100;

        return await ctx.db
            .query("user_progress")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .order("desc")
            .take(limit);
    },
});

/**
 * Get user's progress by status (correct, incorrect, flagged, skipped)
 */
export const getProgressByStatus = query({
    args: {
        status: v.union(
            v.literal("correct"),
            v.literal("incorrect"),
            v.literal("flagged"),
            v.literal("skipped")
        ),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const clerkId = identity.tokenIdentifier.split("|")[1] || identity.subject;
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (!user) {
            return [];
        }

        const limit = args.limit ?? 100;

        return await ctx.db
            .query("user_progress")
            .withIndex("by_status", (q) =>
                q.eq("user_id", user._id).eq("status", args.status)
            )
            .take(limit);
    },
});

/**
 * Get user's progress statistics
 */
export const getProgressStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const clerkId = identity.tokenIdentifier.split("|")[1] || identity.subject;
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (!user) {
            return null;
        }

        const allProgress = await ctx.db
            .query("user_progress")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .collect();

        const stats = {
            total_questions_attempted: allProgress.length,
            correct: allProgress.filter((p) => p.status === "correct").length,
            incorrect: allProgress.filter((p) => p.status === "incorrect").length,
            flagged: allProgress.filter((p) => p.status === "flagged").length,
            skipped: allProgress.filter((p) => p.status === "skipped").length,
            total_attempts: allProgress.reduce((sum, p) => sum + p.attempts, 0),
            total_time_seconds: allProgress.reduce(
                (sum, p) => sum + (p.time_spent_seconds || 0),
                0
            ),
            accuracy:
                allProgress.length > 0
                    ? (allProgress.filter((p) => p.status === "correct").length /
                        allProgress.length) *
                    100
                    : 0,
        };

        return stats;
    },
});

/**
 * Get progress for a specific question
 */
export const getQuestionProgress = query({
    args: {
        question_id: v.id("questions"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const clerkId = identity.tokenIdentifier.split("|")[1] || identity.subject;
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (!user) {
            return null;
        }

        return await ctx.db
            .query("user_progress")
            .withIndex("by_user_and_question", (q) =>
                q.eq("user_id", user._id).eq("question_id", args.question_id)
            )
            .unique();
    },
});

/**
 * Reset progress for a question (for retrying)
 */
export const resetQuestionProgress = mutation({
    args: {
        question_id: v.id("questions"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const clerkId = identity.tokenIdentifier.split("|")[1] || identity.subject;
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const progress = await ctx.db
            .query("user_progress")
            .withIndex("by_user_and_question", (q) =>
                q.eq("user_id", user._id).eq("question_id", args.question_id)
            )
            .unique();

        if (progress) {
            await ctx.db.delete(progress._id);
        }

        return { success: true };
    },
});
