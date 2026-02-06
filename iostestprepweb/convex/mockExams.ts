import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create a new mock exam with UWorld-style configuration
 */
export const createMockExam = mutation({
    args: {
        exam_id: v.id("exams"),
        mode: v.union(v.literal("tutor"), v.literal("timed"), v.literal("untimed")),
        selection_criteria: v.object({
            source: v.union(
                v.literal("all"),
                v.literal("unused"),
                v.literal("incorrect"),
                v.literal("flagged"),
                v.literal("custom")
            ),
            subjects: v.optional(v.array(v.string())),
            topics: v.optional(v.array(v.string())),
            question_count: v.number(),
        }),
        has_timer: v.boolean(),
        time_limit_minutes: v.optional(v.number()),
        time_per_question_seconds: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Select questions based on criteria
        const questionIds = await selectQuestions(
            ctx,
            userId,
            args.exam_id,
            args.selection_criteria
        );

        if (questionIds.length === 0) {
            throw new Error("No questions match the selection criteria");
        }

        const now = Date.now();

        // Initialize answers array
        const answers = questionIds.map((qId) => ({
            question_id: qId,
            selected_choice_index: undefined,
            is_correct: undefined,
            time_spent_seconds: undefined,
            flagged: false,
            marked_for_review: false,
        }));

        // Create mock exam
        const mockExamId = await ctx.db.insert("mock_exams", {
            user_id: userId,
            exam_id: args.exam_id,
            mode: args.mode,
            selection_criteria: args.selection_criteria,
            has_timer: args.has_timer,
            time_limit_minutes: args.time_limit_minutes,
            time_per_question_seconds: args.time_per_question_seconds,
            question_ids: questionIds,
            answers,
            is_completed: false,
            started_at: now,
        });

        return {
            success: true,
            mock_exam_id: mockExamId,
            question_count: questionIds.length,
        };
    },
});

/**
 * Helper function to select questions based on criteria
 */
async function selectQuestions(
    ctx: any,
    userId: Id<"users">,
    examId: Id<"exams">,
    criteria: any
): Promise<Id<"questions">[]> {
    let questions = await ctx.db
        .query("questions")
        .withIndex("by_exam", (q: any) => q.eq("exam_id", examId))
        .filter((q: any) => q.eq(q.field("isActive"), true))
        .collect();

    // Filter by source
    if (criteria.source === "unused") {
        // Get questions user has never attempted
        const progress = await ctx.db
            .query("user_progress")
            .withIndex("by_user", (q: any) => q.eq("user_id", userId))
            .collect();

        const attemptedIds = new Set(progress.map((p: any) => p.question_id));
        questions = questions.filter((q: any) => !attemptedIds.has(q._id));
    } else if (criteria.source === "incorrect") {
        // Get questions user got wrong
        const progress = await ctx.db
            .query("user_progress")
            .withIndex("by_status", (q: any) =>
                q.eq("user_id", userId).eq("status", "incorrect")
            )
            .collect();

        const incorrectIds = new Set(progress.map((p: any) => p.question_id));
        questions = questions.filter((q: any) => incorrectIds.has(q._id));
    } else if (criteria.source === "flagged") {
        // Get flagged questions
        const progress = await ctx.db
            .query("user_progress")
            .withIndex("by_status", (q: any) =>
                q.eq("user_id", userId).eq("status", "flagged")
            )
            .collect();

        const flaggedIds = new Set(progress.map((p: any) => p.question_id));
        questions = questions.filter((q: any) => flaggedIds.has(q._id));
    }

    // Filter by subjects
    if (criteria.subjects && criteria.subjects.length > 0) {
        questions = questions.filter((q: any) =>
            criteria.subjects.includes(q.subject)
        );
    }

    // Filter by topics
    if (criteria.topics && criteria.topics.length > 0) {
        questions = questions.filter((q: any) => criteria.topics.includes(q.topic));
    }

    // Shuffle and limit
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, criteria.question_count);

    return selected.map((q: any) => q._id);
}

/**
 * Submit an answer to a question in the mock exam
 */
export const submitAnswer = mutation({
    args: {
        mock_exam_id: v.id("mock_exams"),
        question_id: v.id("questions"),
        selected_choice_index: v.number(),
        time_spent_seconds: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const mockExam = await ctx.db.get(args.mock_exam_id);
        if (!mockExam) {
            throw new Error("Mock exam not found");
        }

        // Get question to check answer
        const question = await ctx.db.get(args.question_id);
        if (!question) {
            throw new Error("Question not found");
        }

        const isCorrect = args.selected_choice_index === question.correct_choice_index;

        // Update answer in mock exam
        const updatedAnswers = mockExam.answers.map((ans) =>
            ans.question_id === args.question_id
                ? {
                    ...ans,
                    selected_choice_index: args.selected_choice_index,
                    is_correct: isCorrect,
                    time_spent_seconds: args.time_spent_seconds,
                }
                : ans
        );

        await ctx.db.patch(args.mock_exam_id, {
            answers: updatedAnswers,
        });

        // In tutor mode, return if answer is correct
        if (mockExam.mode === "tutor") {
            return { success: true, is_correct: isCorrect };
        }

        return { success: true };
    },
});

/**
 * Flag a question in the mock exam
 */
export const flagQuestionInExam = mutation({
    args: {
        mock_exam_id: v.id("mock_exams"),
        question_id: v.id("questions"),
        flagged: v.boolean(),
    },
    handler: async (ctx, args) => {
        const mockExam = await ctx.db.get(args.mock_exam_id);
        if (!mockExam) {
            throw new Error("Mock exam not found");
        }

        const updatedAnswers = mockExam.answers.map((ans) =>
            ans.question_id === args.question_id
                ? { ...ans, flagged: args.flagged }
                : ans
        );

        await ctx.db.patch(args.mock_exam_id, {
            answers: updatedAnswers,
        });

        return { success: true };
    },
});

/**
 * Complete the mock exam and calculate results
 */
export const completeMockExam = mutation({
    args: {
        mock_exam_id: v.id("mock_exams"),
    },
    handler: async (ctx, args) => {
        const mockExam = await ctx.db.get(args.mock_exam_id);
        if (!mockExam) {
            throw new Error("Mock exam not found");
        }

        // Calculate results
        const correctCount = mockExam.answers.filter((a) => a.is_correct === true).length;
        const incorrectCount = mockExam.answers.filter((a) => a.is_correct === false).length;
        const skippedCount = mockExam.answers.filter(
            (a) => a.selected_choice_index === undefined
        ).length;
        const totalCount = mockExam.answers.length;
        const scorePercentage = (correctCount / totalCount) * 100;

        // Calculate total time
        const totalTime = mockExam.answers.reduce(
            (sum, a) => sum + (a.time_spent_seconds || 0),
            0
        );

        // Calculate performance by subject
        const questions = await Promise.all(
            mockExam.question_ids.map((id) => ctx.db.get(id))
        );

        const subjectStats = new Map<string, { correct: number; total: number }>();

        questions.forEach((q, index) => {
            if (!q) return;

            const subject = q.subject;
            const answer = mockExam.answers[index];

            if (!subjectStats.has(subject)) {
                subjectStats.set(subject, { correct: 0, total: 0 });
            }

            const stats = subjectStats.get(subject)!;
            stats.total += 1;
            if (answer.is_correct) {
                stats.correct += 1;
            }
        });

        const performanceBySubject = Array.from(subjectStats.entries()).map(
            ([subject, stats]) => ({
                subject,
                correct: stats.correct,
                total: stats.total,
                percentage: (stats.correct / stats.total) * 100,
            })
        );

        // Update mock exam
        await ctx.db.patch(args.mock_exam_id, {
            is_completed: true,
            score_percentage: scorePercentage,
            correct_count: correctCount,
            incorrect_count: incorrectCount,
            skipped_count: skippedCount,
            total_time_seconds: totalTime,
            performance_by_subject: performanceBySubject,
            completed_at: Date.now(),
        });

        return {
            success: true,
            score_percentage: scorePercentage,
            correct_count: correctCount,
            incorrect_count: incorrectCount,
            skipped_count: skippedCount,
            performance_by_subject: performanceBySubject,
        };
    },
});

/**
 * Get a mock exam with questions
 */
export const getMockExam = query({
    args: {
        mock_exam_id: v.id("mock_exams"),
    },
    handler: async (ctx, args) => {
        const mockExam = await ctx.db.get(args.mock_exam_id);
        if (!mockExam) {
            return null;
        }

        // Fetch questions
        const questions = await Promise.all(
            mockExam.question_ids.map((id) => ctx.db.get(id))
        );

        return {
            ...mockExam,
            questions: questions.filter((q) => q !== null),
        };
    },
});

/**
 * Get user's mock exam history
 */
export const getMyMockExams = query({
    args: {
        exam_id: v.optional(v.id("exams")),
        completed_only: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const limit = args.limit ?? 50;

        let query = ctx.db
            .query("mock_exams")
            .withIndex("by_user", (q) => q.eq("user_id", userId));

        if (args.exam_id) {
            query = query.filter((q) => q.eq(q.field("exam_id"), args.exam_id));
        }

        if (args.completed_only) {
            query = query.filter((q) => q.eq(q.field("is_completed"), true));
        }

        return await query.order("desc").take(limit);
    },
});

/**
 * Get mock exam statistics
 */
export const getMockExamStats = query({
    args: {
        exam_id: v.optional(v.id("exams")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        let mockExams = await ctx.db
            .query("mock_exams")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            .filter((q) => q.eq(q.field("is_completed"), true))
            .collect();

        if (args.exam_id) {
            mockExams = mockExams.filter((m) => m.exam_id === args.exam_id);
        }

        if (mockExams.length === 0) {
            return {
                total_exams: 0,
                avg_score: 0,
                highest_score: 0,
                lowest_score: 0,
                total_questions_attempted: 0,
            };
        }

        const scores = mockExams.map((m) => m.score_percentage || 0);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const totalQuestions = mockExams.reduce(
            (sum, m) => sum + m.question_ids.length,
            0
        );

        return {
            total_exams: mockExams.length,
            avg_score: avgScore,
            highest_score: highestScore,
            lowest_score: lowestScore,
            total_questions_attempted: totalQuestions,
        };
    },
});

/**
 * Delete a mock exam
 */
export const deleteMockExam = mutation({
    args: {
        mock_exam_id: v.id("mock_exams"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.mock_exam_id);
        return { success: true };
    },
});
