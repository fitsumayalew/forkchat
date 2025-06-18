import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/**
 * account.getUserConfiguration
 *
 * Retrieves the current user's configuration document. This contains UI
 * preferences like the currently-selected model, theme, favourite models, and
 * any model-specific parameters (temperature, top-p, etc.). If the user is not
 * authenticated or no configuration has been stored yet, `null` is returned.
 */
export const getUserConfiguration = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const config = await ctx.db
      .query("userConfiguration")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return config || {
      userId,
      currentlySelectedModel: "gpt-4o-mini", // Default model
      theme: "system",
      preferOwnApiKeys: false,
      favoriteModels: [],
      currentModelParameters: {
        temperature: 0.7,
        topP: 0.9,
        includeSearch: false,
      },
    };
  },
});

/**
 * account.getUserConfigurationInternal
 *
 * Internal version of getUserConfiguration that accepts a userId parameter
 */
export const getUserConfigurationInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const config = await ctx.db
      .query("userConfiguration")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return config || {
      userId,
      currentlySelectedModel: "gpt-4o-mini", // Default model
      theme: "system", 
      preferOwnApiKeys: false,
      favoriteModels: [],
      currentModelParameters: {
        temperature: 0.7,
        topP: 0.9,
        includeSearch: false,
      },
    };
  },
});

/**
 * account.getUserPromptCustomization
 *
 * Fetch a user-specific prompt customization.
 */
export const getUserPromptCustomization = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Fetch prompt customization for this user.
    return await ctx.db
      .query("userPromptCustomization")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

/**
 * account.getUserPromptCustomizationInternal
 *
 * Internal version of getUserPromptCustomization that accepts a userId parameter
 */
export const getUserPromptCustomizationInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("userPromptCustomization")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

/**
 * account.getPaginatedThreads
 *
 * Similar to `getPaginatedMessages`, but returns threads for the authenticated
 * user ordered by `updatedAt` (descending).  This is useful when implementing
 * data-management UIs or allowing users to export their conversation history.
 */
export const getPaginatedThreads = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return [];

    const threads = await ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    return threads
  },
});

/**
 * account.getPaginatedMessages
 *
 * Return a page of messages belonging to the authenticated user.  Pagination is
 * done with a simple `page`/`pageSize` mechanism to keep the client code
 * straightforward. If you need cursor-based pagination, adapt this helper to
 * return `nextCursor` instead of `nextPage`.
 */
export const getPaginatedMessages = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    return messages;
  },
});

/**
 * account.getUserApiKeys
 *
 * Retrieves the current user's API keys (without exposing the actual key values)
 */
export const getUserApiKeys = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const apiKeys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Return API keys without the encrypted values for security
    return apiKeys.map(key => ({
      _id: key._id,
      provider: key.provider,
      keyName: key.keyName,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
    }));
  },
});
