import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new question
 */
export const createQuestion = mutation({
    args: {
        q_text: v.string(),
        q_image: v.optional(v.id("_storage")),
        choices: v.array(v.string()),
        correct_choice_index: v.number(),
        explanation: v.string(),
        explanation_image: v.optional(v.id("_storage")),
        source_of_answer: v.optional(v.string()),
        hy_summary: v.string(),
        exam_id: v.id("exams"),
        subject: v.string(),
        topic: v.string(),
        ai_generated: v.boolean(),
        ai_model: v.optional(v.string()),
        ai_confidence: v.optional(v.number()),
        source_type: v.union(
            v.literal("ai_generated"),
            v.literal("pdf_extracted"),
            v.literal("manual_entry"),
            v.literal("user_upload"),
            v.literal("telegram")
        ),
        verified: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Get exam to fetch name
        const exam = await ctx.db.get(args.exam_id);
        if (!exam) {
            throw new Error("Exam not found");
        }

        // Create question
        const questionId = await ctx.db.insert("questions", {
            q_text: args.q_text,
            q_image: args.q_image,
            choices: args.choices,
            correct_choice_index: args.correct_choice_index,
            explanation: args.explanation,
            explanation_image: args.explanation_image,
            source_of_answer: args.source_of_answer,
            hy_summary: args.hy_summary,
            exam_id: args.exam_id,
            exam_name: exam.name, // Denormalized for fast queries
            subject: args.subject,
            topic: args.topic,
            ai_generated: args.ai_generated,
            ai_model: args.ai_model,
            ai_confidence: args.ai_confidence,
            source_type: args.source_type,
            verified: args.verified ?? false,
            feedback: [],
            isActive: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
        });

        // Update exam question count
        await ctx.db.patch(args.exam_id, {
            active_question_count: exam.active_question_count + 1,
            updatedAt: now,
        });

        return questionId;
    },
});

/**
 * Get questions by exam
 */
export const getQuestionsByExam = query({
    args: {
        exam_id: v.id("exams"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        return await ctx.db
            .query("questions")
            .withIndex("by_exam", (q) => q.eq("exam_id", args.exam_id))
            .filter((q) => q.eq(q.field("isActive"), true))
            .take(limit);
    },
});

/**
 * Get questions by exam and subject
 */
export const getQuestionsBySubject = query({
    args: {
        exam_id: v.id("exams"),
        subject: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        return await ctx.db
            .query("questions")
            .withIndex("by_exam_and_subject", (q) =>
                q.eq("exam_id", args.exam_id).eq("subject", args.subject)
            )
            .filter((q) => q.eq(q.field("isActive"), true))
            .take(limit);
    },
});

/**
 * Get questions by exam and topic
 */
export const getQuestionsByTopic = query({
    args: {
        exam_id: v.id("exams"),
        topic: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        return await ctx.db
            .query("questions")
            .withIndex("by_exam_and_topic", (q) =>
                q.eq("exam_id", args.exam_id).eq("topic", args.topic)
            )
            .filter((q) => q.eq(q.field("isActive"), true))
            .take(limit);
    },
});

/**
 * Add feedback to a question
 */
export const addFeedback = mutation({
    args: {
        question_id: v.id("questions"),
        feedback_type: v.union(
            v.literal("wrong_answer"),
            v.literal("wrong_choice"),
            v.literal("bad_question"),
            v.literal("typo"),
            v.literal("unclear"),
            v.literal("duplicate"),
            v.literal("other")
        ),
        feedback_text: v.optional(v.string()),
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

        const question = await ctx.db.get(args.question_id);
        if (!question) {
            throw new Error("Question not found");
        }

        // Add feedback to array
        const newFeedback = {
            type: args.feedback_type,
            text: args.feedback_text,
            user_id: user._id,
            timestamp: Date.now(),
        };

        await ctx.db.patch(args.question_id, {
            feedback: [...question.feedback, newFeedback],
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Get question by ID
 */
export const getQuestion = query({
    args: {
        question_id: v.id("questions"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.question_id);
    },
});

/**
 * Update question verification status
 */
export const verifyQuestion = mutation({
    args: {
        question_id: v.id("questions"),
        verified: v.boolean(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.question_id, {
            verified: args.verified,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Get questions by subject only (across all exams)
 */
export const getQuestionsBySubjectOnly = query({
    args: {
        subject: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        return await ctx.db
            .query("questions")
            .withIndex("by_subject", (q) => q.eq("subject", args.subject))
            .filter((q) => q.eq(q.field("isActive"), true))
            .take(limit);
    },
});

/**
 * Get questions by topic only (across all exams)
 */
export const getQuestionsByTopicOnly = query({
    args: {
        topic: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        return await ctx.db
            .query("questions")
            .withIndex("by_topic", (q) => q.eq("topic", args.topic))
            .filter((q) => q.eq(q.field("isActive"), true))
            .take(limit);
    },
});

/**
 * Get questions by exam name (using denormalized field)
 */
export const getQuestionsByExamName = query({
    args: {
        exam_name: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        return await ctx.db
            .query("questions")
            .withIndex("by_exam_name", (q) => q.eq("exam_name", args.exam_name))
            .filter((q) => q.eq(q.field("isActive"), true))
            .take(limit);
    },
});

/**
 * Delete a question (soft delete by setting isActive to false)
 */
export const deleteQuestion = mutation({
    args: {
        question_id: v.id("questions"),
    },
    handler: async (ctx, args) => {
        const question = await ctx.db.get(args.question_id);
        if (!question) {
            throw new Error("Question not found");
        }

        // Soft delete
        await ctx.db.patch(args.question_id, {
            isActive: false,
            updatedAt: Date.now(),
        });

        // Update exam question count
        const exam = await ctx.db.get(question.exam_id);
        if (exam && exam.active_question_count > 0) {
            await ctx.db.patch(question.exam_id, {
                active_question_count: exam.active_question_count - 1,
                updatedAt: Date.now(),
            });
        }

        return { success: true };
    },
});

/**
 * Permanently delete a question (hard delete)
 */
export const permanentlyDeleteQuestion = mutation({
    args: {
        question_id: v.id("questions"),
    },
    handler: async (ctx, args) => {
        const question = await ctx.db.get(args.question_id);
        if (!question) {
            throw new Error("Question not found");
        }

        // Update exam count if question was active
        if (question.isActive) {
            const exam = await ctx.db.get(question.exam_id);
            if (exam && exam.active_question_count > 0) {
                await ctx.db.patch(question.exam_id, {
                    active_question_count: exam.active_question_count - 1,
                    updatedAt: Date.now(),
                });
            }
        }

        // Hard delete
        await ctx.db.delete(args.question_id);

        return { success: true };
    },
});
