import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * messages.getByThreadId
 * 
 * Purpose: Retrieves all messages for a specific conversation thread.
 * How it's used: This query is called when a user opens a conversation thread
 * to display all the messages in that thread in chronological order.
 */
export const getByThreadId = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_userid", (q) => 
        q.eq("threadId", threadId).eq("userId", userId)
      )
      .order("desc")
      .collect();

    return messages.reverse();
  },
});

/**
 * messages.getPublicByThreadId
 * 
 * Purpose: Retrieves all messages for a public shared thread.
 * This doesn't require authentication and only works with public threads.
 */
export const getPublicByThreadId = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    // First check if the thread is public
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .filter((q) => q.eq(q.field("visibility"), "visible"))
      .unique();

    if (!thread) {
      return null; // Thread not found or not public
    }

    // Fetch messages for the public thread
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .order("desc")
      .collect();

    return messages.reverse();
  },
});

/**
 * messages.getByThreadIdInternal
 * 
 * Internal version of getByThreadId that accepts userId as a parameter
 */
export const getByThreadIdInternal = internalQuery({
  args: { 
    threadId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { threadId, userId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_userid", (q) => 
        q.eq("threadId", threadId).eq("userId", userId)
      )
      .order("desc")
      .collect();

    return messages.reverse();
  },
});




