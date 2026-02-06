import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the set of exam IDs the current user has saved (bookmarked).
 */
export const getMySavedExamIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const saved = await ctx.db
      .query("saved_exams")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return saved.map((s) => s.examId);
  },
});

/**
 * Toggle save (bookmark) for an exam. If already saved, unsave; otherwise save.
 */
export const toggleSaved = mutation({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in to save exams");

    const existing = await ctx.db
      .query("saved_exams")
      .withIndex("by_user_and_exam", (q) =>
        q.eq("userId", userId).eq("examId", args.examId)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }
    await ctx.db.insert("saved_exams", {
      userId: userId,
      examId: args.examId,
      createdAt: now,
    });
    return { saved: true };
  },
});
