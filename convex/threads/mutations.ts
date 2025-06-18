import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * threads.update
 * 
 * Updates a thread's properties, such as its title or pinned status.
 */
export const update = mutation({
  args: {
    threadId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      pinned: v.optional(v.boolean()),
      folderId: v.optional(v.union(v.id("folders"), v.null())),
      userSetTitle: v.optional(v.boolean()),
      visibility: v.optional(v.union(v.literal("visible"), v.literal("archived"))),
    }),
  },
  handler: async (ctx, { threadId, updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the thread by threadId and userId to ensure ownership
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_and_threadId", (q) => 
        q.eq("userId", userId).eq("threadId", threadId)
      )
      .unique();

    if (!thread) {
      throw new Error("Thread not found or access denied");
    }

    // Prepare the update object
    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Handle regular updates
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.pinned !== undefined) updateData.pinned = updates.pinned;
    if (updates.userSetTitle !== undefined) updateData.userSetTitle = updates.userSetTitle;
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
    
    // Handle folderId updates - null means remove from folder
    if (updates.folderId !== undefined) {
      if (updates.folderId === null) {
        updateData.folderId = undefined;
      } else {
        updateData.folderId = updates.folderId;
      }
    }

    // Update the thread
    await ctx.db.patch(thread._id, updateData);

    return { success: true } as const;
  },
});

/**
 * threads.remove
 * 
 * Deletes a conversation thread and all its associated messages.
 */
export const remove = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the thread by threadId and userId to ensure ownership
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_and_threadId", (q) => 
        q.eq("userId", userId).eq("threadId", threadId)
      )
      .unique();

    if (!thread) {
      throw new Error("Thread not found or access denied");
    }

    // Delete all messages associated with this thread
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_userid", (q) => 
        q.eq("threadId", threadId).eq("userId", userId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the thread itself
    await ctx.db.delete(thread._id);

    return { success: true, deletedThreadId: threadId } as const;
  },
});

/**
 * threads.bulkDelete
 * 
 * Deletes multiple threads at once.
 */
export const bulkDelete = mutation({
  args: { threadIds: v.array(v.string()) },
  handler: async (ctx, { threadIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const deletedThreadIds: string[] = [];
    const errors: string[] = [];

    for (const threadId of threadIds) {
      try {
        // Find the thread by threadId and userId to ensure ownership
        const thread = await ctx.db
          .query("threads")
          .withIndex("by_user_and_threadId", (q) => 
            q.eq("userId", userId).eq("threadId", threadId)
          )
          .unique();

        if (!thread) {
          errors.push(`Thread ${threadId} not found or access denied`);
          continue;
        }

        // Delete all messages associated with this thread
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_thread_and_userid", (q) => 
            q.eq("threadId", threadId).eq("userId", userId)
          )
          .collect();

        for (const message of messages) {
          await ctx.db.delete(message._id);
        }

        // Delete the thread itself
        await ctx.db.delete(thread._id);
        deletedThreadIds.push(threadId);
      } catch (error) {
        errors.push(`Failed to delete thread ${threadId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { 
      success: true, 
      deletedThreadIds, 
      errors: errors.length > 0 ? errors : undefined 
    } as const;
  },
});



export const updateThread = internalMutation({
  args: {
    threadId: v.string(),
    generationStatus: v.optional(v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("failed"))),
    title: v.optional(v.string()),
  },
  handler: async (ctx,  payload) => {
    const {threadId,...updates } = payload;
    // Find the thread by threadId
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .unique();

    if (!thread) {
      throw new Error("Thread not found");
    }

    await ctx.db.patch(thread._id, updates);
  },
});