import { v } from "convex/values";
import { query } from "../_generated/server";
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

