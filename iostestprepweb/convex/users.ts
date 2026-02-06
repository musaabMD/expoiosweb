import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Store or update the current user in the database.
 * Called when a user signs in or signs up.
 * Uses Convex Auth identity.
 */
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Called storeUser without authentication");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Failed to get user identity");
    }

    // Check if user already exists
    const existingUser = await ctx.db.get(userId);

    const now = Date.now();

    if (existingUser) {
      // Update existing user with latest info
      await ctx.db.patch(userId, {
        email: identity.email ?? existingUser.email,
        name: identity.name ?? existingUser.name,
        firstName: identity.givenName ?? existingUser.firstName,
        lastName: identity.familyName ?? existingUser.lastName,
        imageUrl: identity.pictureUrl ?? existingUser.imageUrl,
        updatedAt: now,
      });
      return userId;
    }

    // User doesn't exist yet - this can happen if Convex Auth didn't auto-create
    // Create a new user record
    const newUserId = await ctx.db.insert("users", {
      email: identity.email,
      name: identity.name,
      firstName: identity.givenName,
      lastName: identity.familyName,
      imageUrl: identity.pictureUrl,
      createdAt: now,
      updatedAt: now,
    });

    return newUserId;
  },
});

/**
 * Get the current authenticated user from the database.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    return user;
  },
});

/**
 * Get a user by their Convex ID.
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get a user by their email.
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
  },
});

/**
 * Update the current user's profile.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(userId, {
      ...args,
      updatedAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Delete the current user's account.
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.delete(userId);
    return true;
  },
});
