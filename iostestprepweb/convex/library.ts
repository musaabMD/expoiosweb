import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a library item (article, section, or card)
 */
export const createLibraryItem = mutation({
    args: {
        type: v.union(v.literal("article"), v.literal("section"), v.literal("card")),
        title: v.string(),
        content_md: v.optional(v.string()),
        parent_id: v.optional(v.id("library")),
        image_id: v.optional(v.id("_storage")),
        external_link: v.optional(v.string()),
        exam_id: v.optional(v.id("exams")),
        subject: v.optional(v.string()),
        topic: v.optional(v.string()),
        related_question_ids: v.optional(v.array(v.id("questions"))),
        source: v.optional(v.string()),
        order: v.optional(v.number()),
        ai_generated: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Auto-calculate order if not provided
        let order = args.order ?? 0;
        if (!args.order) {
            // Get max order for siblings
            const siblings = await ctx.db
                .query("library")
                .withIndex("by_parent", (q) =>
                    args.parent_id
                        ? q.eq("parent_id", args.parent_id)
                        : q.eq("parent_id", undefined)
                )
                .collect();

            order = siblings.length > 0
                ? Math.max(...siblings.map(s => s.order)) + 1
                : 0;
        }

        const itemId = await ctx.db.insert("library", {
            parent_id: args.parent_id,
            type: args.type,
            title: args.title,
            content_md: args.content_md,
            image_id: args.image_id,
            external_link: args.external_link,
            exam_id: args.exam_id,
            subject: args.subject,
            topic: args.topic,
            related_question_ids: args.related_question_ids ?? [],
            source: args.source,
            order,
            ai_generated: args.ai_generated ?? false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        return { success: true, item_id: itemId };
    },
});

/**
 * Update a library item
 */
export const updateLibraryItem = mutation({
    args: {
        item_id: v.id("library"),
        title: v.optional(v.string()),
        content_md: v.optional(v.string()),
        image_id: v.optional(v.id("_storage")),
        external_link: v.optional(v.string()),
        subject: v.optional(v.string()),
        topic: v.optional(v.string()),
        related_question_ids: v.optional(v.array(v.id("questions"))),
        source: v.optional(v.string()),
        order: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { item_id, ...updates } = args;

        await ctx.db.patch(item_id, {
            ...updates,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Delete a library item (and optionally its children)
 */
export const deleteLibraryItem = mutation({
    args: {
        item_id: v.id("library"),
        delete_children: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Helper function for recursive deletion
        const deleteRecursive = async (itemId: any) => {
            const children = await ctx.db
                .query("library")
                .withIndex("by_parent", (q) => q.eq("parent_id", itemId))
                .collect();

            for (const child of children) {
                await deleteRecursive(child._id);
            }

            await ctx.db.delete(itemId);
        };

        if (args.delete_children) {
            await deleteRecursive(args.item_id);
        } else {
            await ctx.db.delete(args.item_id);
        }

        return { success: true };
    },
});

/**
 * Get all root articles
 */
export const getArticles = query({
    args: {
        exam_id: v.optional(v.id("exams")),
        subject: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;

        let query = ctx.db
            .query("library")
            .withIndex("by_type", (q) => q.eq("type", "article"))
            .filter((q) => q.eq(q.field("isActive"), true));

        if (args.exam_id) {
            query = query.filter((q) => q.eq(q.field("exam_id"), args.exam_id));
        }

        if (args.subject) {
            query = query.filter((q) => q.eq(q.field("subject"), args.subject));
        }

        return await query.take(limit);
    },
});

/**
 * Get children of a library item (sections or cards)
 */
export const getLibraryChildren = query({
    args: {
        parent_id: v.id("library"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("library")
            .withIndex("by_parent", (q) => q.eq("parent_id", args.parent_id))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

/**
 * Get full library tree (article with all nested sections and cards)
 */
export const getLibraryTree = query({
    args: {
        article_id: v.id("library"),
    },
    handler: async (ctx, args) => {
        const article = await ctx.db.get(args.article_id);
        if (!article || article.type !== "article") {
            return null;
        }

        // Get sections
        const sections = await ctx.db
            .query("library")
            .withIndex("by_parent", (q) => q.eq("parent_id", args.article_id))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // Get cards for each section
        const sectionsWithCards = await Promise.all(
            sections.map(async (section) => {
                const cards = await ctx.db
                    .query("library")
                    .withIndex("by_parent", (q) => q.eq("parent_id", section._id))
                    .filter((q) => q.eq(q.field("isActive"), true))
                    .collect();

                return {
                    ...section,
                    cards,
                };
            })
        );

        return {
            ...article,
            sections: sectionsWithCards,
        };
    },
});

/**
 * Get a single library item
 */
export const getLibraryItem = query({
    args: {
        item_id: v.id("library"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.item_id);
    },
});

/**
 * Search library by title
 */
export const searchLibrary = query({
    args: {
        search_term: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const searchLower = args.search_term.toLowerCase();

        const allItems = await ctx.db
            .query("library")
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // Filter by title match
        const matches = allItems.filter((item) =>
            item.title.toLowerCase().includes(searchLower)
        );

        return matches.slice(0, limit);
    },
});

/**
 * Reorder library items (change order)
 */
export const reorderLibraryItems = mutation({
    args: {
        item_id: v.id("library"),
        new_order: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.item_id, {
            order: args.new_order,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Add question to library item
 */
export const addQuestionToLibrary = mutation({
    args: {
        item_id: v.id("library"),
        question_id: v.id("questions"),
    },
    handler: async (ctx, args) => {
        const item = await ctx.db.get(args.item_id);
        if (!item) {
            throw new Error("Library item not found");
        }

        // Check if question already linked
        if (item.related_question_ids.includes(args.question_id)) {
            return { success: false, message: "Question already linked" };
        }

        await ctx.db.patch(args.item_id, {
            related_question_ids: [...item.related_question_ids, args.question_id],
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Remove question from library item
 */
export const removeQuestionFromLibrary = mutation({
    args: {
        item_id: v.id("library"),
        question_id: v.id("questions"),
    },
    handler: async (ctx, args) => {
        const item = await ctx.db.get(args.item_id);
        if (!item) {
            throw new Error("Library item not found");
        }

        await ctx.db.patch(args.item_id, {
            related_question_ids: item.related_question_ids.filter(
                (id) => id !== args.question_id
            ),
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});
