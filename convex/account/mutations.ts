import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * account.claimThreadsOnLogin
 *
 * Re-assigns any threads, messages, and attachments that were created while the
 * user was anonymous (i.e. before they signed in) to their newly-authenticated
 * account. Client code should provide the anonymous `guestUserId` (if any) that
 * was previously used to create these documents.
 */
export const claimThreadsOnLogin = mutation({
  args: { guestUserId: v.optional(v.string()) },
  handler: async (ctx, { guestUserId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!guestUserId || guestUserId === userId) return { migrated: false } as const;

    // Migrate threads.
    for await (const thread of ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", guestUserId))) {
      await ctx.db.patch(thread._id, { userId });
    }

    // Migrate messages.
    for await (const message of ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", guestUserId))) {
      await ctx.db.patch(message._id, { userId });
    }

    // Migrate attachments.
    for await (const attachment of ctx.db
      .query("attachments")
      .withIndex("by_userId", (q) => q.eq("userId", guestUserId))) {
      await ctx.db.patch(attachment._id, { userId });
    }

    return { migrated: true } as const;
  },
});


/**
 * account.updateUserConfiguration
 *
 * Persist the user's configuration document. The client should send only the
 * fields that changed; this mutation performs a shallow merge with any existing
 * configuration.  All writes are scoped to the authenticated user and validated
 * against the schema.
 */
export const updateUserConfiguration = mutation({
  args: {
    configuration: v.object({
      theme: v.optional(v.string()),
      currentlySelectedModel: v.optional(v.string()),
      currentModelParameters: v.optional(v.any()),
      favoriteModels: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { configuration }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userConfiguration")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...configuration });
    } else {
      await ctx.db.insert("userConfiguration", {
        userId,
        ...configuration,
      });
    }
  },
});

/**
 * account.updateUserPromptCustomization
 *
 * Upsert a prompt customization profile.
 */
export const updateUserPromptCustomization = mutation({
  args: {
      name: v.optional(v.string()),
      occupation: v.optional(v.string()),
      selectedTraits: v.optional(v.array(v.string())),
      additionalInfo: v.optional(v.string()),
  },
  handler: async (ctx, customization ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userPromptCustomization")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, customization);
    } else {
      await ctx.db.insert("userPromptCustomization", {
        userId,
        ...customization,
      });
    }
  },
});

/**
 * accountServices.deleteHistory
 *
 * Deletes all threads, messages, and attachments for the authenticated user.
 * TODO: 
 */
export const deleteHistory = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await deleteHistoryImpl(ctx, userId);

    return { deleted: true } as const;
  },
});

// Internal helper so we can reuse the same logic from `deleteAccount`.
async function deleteHistoryImpl(ctx: any, userId: string) {
  // Delete messages first to avoid dangling references.
  for await (const message of ctx.db
    .query("messages")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))) {
    await ctx.db.delete(message._id);
  }

  // Delete threads.
  for await (const thread of ctx.db
    .query("threads")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))) {
    await ctx.db.delete(thread._id);
  }

  // Delete attachments.
  for await (const attachment of ctx.db
    .query("attachments")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))) {
    await ctx.db.delete(attachment._id);
  }
}

/**
 * accountServices.deleteUploads
 *
 * Permanently delete specific attachment documents belonging to the user.
 */
export const deleteUploads = mutation({
  args: { attachmentIds: v.array(v.id("attachments")) },
  handler: async (ctx, { attachmentIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    for (const id of attachmentIds) {
      const attachment = await ctx.db.get(id);
      if (attachment && attachment.userId === userId) {
        await ctx.db.delete(id);
      }
    }

    return { deletedIds: attachmentIds } as const;
  },
});

/**
 * accountServices.deleteAccount
 *
 * Fully remove the authenticated user's account and all associated data.
 * This is a destructive operation and cannot be undone.
 */
export const deleteAccount = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Remove all user data first.
    await deleteHistoryImpl(ctx, userId);

    // Delete configuration and prompt customisations.
    for await (const config of ctx.db
      .query("userConfiguration")
      .withIndex("by_userId", (q) => q.eq("userId", userId))) {
      await ctx.db.delete(config._id);
    }

    for await (const profile of ctx.db
      .query("userPromptCustomization")
      .withIndex("by_userId", (q) => q.eq("userId", userId))) {
      await ctx.db.delete(profile._id);
    }

    // Finally, delete the user document from Convex Auth `users` table.
    const authUser = await ctx.db.get(userId);
    if (authUser) {
      await ctx.db.delete(userId);
    }

    return { accountDeleted: true } as const;
  },
});
