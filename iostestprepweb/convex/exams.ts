import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed SCFHS Saudi medical exams
 * Run this once to populate the exams table
 */
export const seedSCFHSExams = mutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const exams = [
            {
                name: "SMLE",
                description: "Saudi Medical Licensure Exam",
                category: "Medical" as const,
                provider: "SCFHS",
                country: "🇸🇦",
                icon: "🩺",
                active_question_count: 0,
                hy_notes_count: 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },
            {
                name: "SDLE",
                description: "Saudi Dental Licensure Exam",
                category: "Medical" as const,
                provider: "SCFHS",
                country: "🇸🇦",
                icon: "🦷",
                active_question_count: 0,
                hy_notes_count: 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },
            {
                name: "SPLE",
                description: "Saudi Pharmacy Licensure Exam",
                category: "Medical" as const,
                provider: "SCFHS",
                country: "🇸🇦",
                icon: "💊",
                active_question_count: 0,
                hy_notes_count: 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },
            {
                name: "SNLE",
                description: "Saudi Nursing Licensure Exam",
                category: "Medical" as const,
                provider: "SCFHS",
                country: "🇸🇦",
                icon: "👨‍⚕️",
                active_question_count: 0,
                hy_notes_count: 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },
            {
                name: "SLLE",
                description: "Saudi Laboratory Licensure Exam",
                category: "Medical" as const,
                provider: "SCFHS",
                country: "🇸🇦",
                icon: "🔬",
                active_question_count: 0,
                hy_notes_count: 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },
            {
                name: "Family Medicine",
                description: "SCFHS Family Medicine Specialty Exam",
                category: "Medical" as const,
                provider: "SCFHS",
                country: "🇸🇦",
                icon: "👨‍👩‍👧‍👦",
                active_question_count: 0,
                hy_notes_count: 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },
            {
                name: "Preventive Medicine",
                description: "SCFHS Preventive Medicine Specialty Exam",
                category: "Medical" as const,
                provider: "SCFHS",
                country: "🇸🇦",
                icon: "🛡️",
                active_question_count: 0,
                hy_notes_count: 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },
        ];

        const insertedIds = [];
        for (const exam of exams) {
            // Check if exam already exists
            const existing = await ctx.db
                .query("exams")
                .filter((q) => q.eq(q.field("name"), exam.name))
                .first();

            if (!existing) {
                const id = await ctx.db.insert("exams", exam);
                insertedIds.push(id);
            }
        }

        return {
            success: true,
            inserted: insertedIds.length,
            message: `Successfully seeded ${insertedIds.length} SCFHS exams`,
        };
    },
});

/**
 * Get all active exams
 */
export const getActiveExams = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("exams")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();
    },
});

/**
 * Get all exams (active and inactive)
 */
export const getExams = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("exams")
            .collect();
    },
});

/**
 * Get all exams with live counts from DB (questions, library).
 * Any change in questions or library is reflected immediately.
 */
export const getExamsWithLiveCounts = query({
    args: {},
    handler: async (ctx) => {
        const [exams, allActiveQuestions, allLibraryItems] = await Promise.all([
            ctx.db.query("exams").collect(),
            ctx.db
                .query("questions")
                .filter((q) => q.eq(q.field("isActive"), true))
                .collect(),
            ctx.db.query("library").collect(),
        ]);

        const questionCountByExam: Record<string, number> = {};
        for (const q of allActiveQuestions) {
            const id = q.exam_id;
            questionCountByExam[id] = (questionCountByExam[id] ?? 0) + 1;
        }

        const libraryCountByExam: Record<string, number> = {};
        for (const item of allLibraryItems) {
            const id = item.exam_id;
            if (id != null) {
                libraryCountByExam[id] = (libraryCountByExam[id] ?? 0) + 1;
            }
        }

        return exams.map((exam) => ({
            ...exam,
            active_question_count: questionCountByExam[exam._id] ?? 0,
            hy_notes_count: libraryCountByExam[exam._id] ?? 0,
        }));
    },
});

/**
 * Get a single exam by ID
 */
export const getExam = query({
    args: {
        exam_id: v.id("exams"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.exam_id);
    },
});

/**
 * Create a new exam
 */
export const createExam = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        category: v.union(
            v.literal("Medical"),
            v.literal("Law"),
            v.literal("IT"),
            v.literal("Language"),
            v.literal("Other")
        ),
        provider: v.string(),
        country: v.string(),
        icon: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const examId = await ctx.db.insert("exams", {
            name: args.name,
            description: args.description,
            category: args.category,
            provider: args.provider,
            country: args.country,
            icon: args.icon,
            active_question_count: 0,
            hy_notes_count: 0,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
        });

        return { success: true, exam_id: examId };
    },
});

/**
 * Update an exam
 */
export const updateExam = mutation({
    args: {
        exam_id: v.id("exams"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { exam_id, ...updates } = args;

        await ctx.db.patch(exam_id, {
            ...updates,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

