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
