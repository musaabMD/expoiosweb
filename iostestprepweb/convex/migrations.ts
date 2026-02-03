import { mutation } from "./_generated/server";

/**
 * Migration: Add exam_name to existing questions
 * Run this once to populate exam_name for all existing questions
 */
export const addExamNameToQuestions = mutation({
    args: {},
    handler: async (ctx) => {
        const questions = await ctx.db.query("questions").collect();

        let updated = 0;
        for (const question of questions) {
            // Get exam name
            const exam = await ctx.db.get(question.exam_id);
            if (exam) {
                await ctx.db.patch(question._id, {
                    exam_name: exam.name,
                });
                updated++;
            }
        }

        return {
            success: true,
            updated,
            message: `Updated ${updated} questions with exam_name`,
        };
    },
});
