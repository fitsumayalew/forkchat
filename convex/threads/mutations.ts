import { v } from "convex/values";
import { internalMutation, mutation, action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";

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
      isPublic: v.optional(v.boolean()),
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
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    
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

/**
 * threads.toggleShare
 * 
 * Toggles the public sharing status of a thread.
 */
export const toggleShare = mutation({
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

    // Toggle the public status
    const newIsPublic = !thread.isPublic;
    
    await ctx.db.patch(thread._id, {
      isPublic: newIsPublic,
      updatedAt: Date.now(),
    });

    return { success: true, isPublic: newIsPublic } as const;
  },
});

/**
 * threads.copySharedThread
 * 
 * Purpose: Copies a public shared thread and all its messages to the current user's account.
 * This allows users to continue a shared conversation in their own chat.
 * How it's used: Called when a logged-in user clicks "Add to my chats" on a shared thread.
 */
export const copySharedThread = mutation({
  args: { 
    sharedThreadId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { sharedThreadId, title }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the public thread
    const sharedThread = await ctx.db
      .query("threads")
      .withIndex("by_threadId", (q) => q.eq("threadId", sharedThreadId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .first();

    if (!sharedThread) {
      throw new Error("Shared thread not found or not public");
    }

    // Generate a new thread ID for the copy
    const newThreadId = crypto.randomUUID();

    // Create the new thread
    await ctx.db.insert("threads", {
      threadId: newThreadId,
      title: title || `Copy of ${sharedThread.title}`,
      updatedAt: Date.now(),
      lastMessageAt: Date.now(),
      generationStatus: "completed",
      visibility: "visible",
      isPublic: false, // Default to private
      userSetTitle: title ? true : false,
      userId: userId,
      model: sharedThread.model,
      pinned: false,
    });

    // Copy all messages from the shared thread
    const sharedMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_userid", (q) => 
        q.eq("threadId", sharedThreadId).eq("userId", sharedThread.userId)
      )
      .collect();

    // Copy messages to the new thread
    for (const message of sharedMessages) {
      const { _id, _creationTime, ...messageData } = message;
      await ctx.db.insert("messages", {
        ...messageData,
        threadId: newThreadId,
        userId: userId,
        messageId: crypto.randomUUID(), // Generate new message ID
      });
    }

    return { 
      success: true,
      newThreadId,
      message: "Chat copied successfully!"
    };
  },
});

/**
 * threads.generateSummary
 * 
 * Purpose: Generates a comprehensive summary of a chat thread using AI.
 * How it's used: Called when user clicks the summary button to get an overview of the conversation.
 */
export const generateSummary = action({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }): Promise<{
    success: boolean;
    summary: string;
    threadTitle: string;
    messageCount: number;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the chat data for summarization
    const chatData = await ctx.runQuery(internal.threads.queries.summarizeChat, { threadId, userId });
    
    if (!chatData || !chatData.messages.length) {
      throw new Error("No messages found in this thread or access denied");
    }

    // Generate the summary using AI
    const summary: string = await ctx.runAction(internal.ai.chat.generateChatSummary, {
      messages: chatData.messages
    });

    return {
      success: true,
      summary,
      threadTitle: chatData.thread.title,
      messageCount: chatData.messages.length
    };
  },
});