import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * threads.get
 * 
 * Purpose: This is the primary query for the sidebar. It fetches all of the user's conversation threads.
 * How it's used: The result of this query is the master list of threads that gets filtered and organized 
 * on the client-side into Pinned, Foldered, and Un-categorized sections. The client-side logic will 
 * handle sorting by updatedAt and grouping by time.
 */
export const get = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("visibility"), "visible"))
      .order("desc")
      .collect();
  },
});

/**
 * threads.search
 * 
 * Purpose: Powers the search functionality. When a user types in the search bar, this query is called 
 * to find threads and messages that match the search term.
 * How it's used: It returns a filtered list of threads, which temporarily replaces the full list from 
 * threads.get in the sidebar UI.
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (!searchTerm.trim()) {
      // If search term is empty, return all visible threads
      return await ctx.db
        .query("threads")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("visibility"), "visible"))
        .order("desc")
        .collect();
    }

    // Search by thread title using the search index
    const threadResults = await ctx.db
      .query("threads")
      .withSearchIndex("search_title", (q) => 
        q.search("title", searchTerm).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("visibility"), "visible"))
      .collect();

    // Also search through messages - since Convex doesn't support case-insensitive string operations
    // in filters, we'll do a broader search and filter client-side
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter messages that contain the search term (case-insensitive)
    const matchingMessages = allMessages.filter(msg => 
      msg.parts?.some(part => part.type === "text" && part.text.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Get unique thread IDs from matching messages
    const messageThreadIds = [...new Set(matchingMessages.map(msg => msg.threadId))];
    
    // Fetch threads that contain matching messages
    const messageThreadResults = await Promise.all(
      messageThreadIds.map(async (threadId) => {
        return await ctx.db
          .query("threads")
          .withIndex("by_user_and_threadId", (q) => 
            q.eq("userId", userId).eq("threadId", threadId)
          )
          .filter((q) => q.eq(q.field("visibility"), "visible"))
          .unique();
      })
    );

    // Combine and deduplicate results
    const allThreads = [...threadResults, ...messageThreadResults.filter((t): t is NonNullable<typeof t> => t !== null)];
    const uniqueThreads = allThreads.filter((thread, index, arr) => 
      arr.findIndex(t => t._id === thread._id) === index
    );

    // Sort by updatedAt descending
    return uniqueThreads.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * threads.getPublicThread
 * 
 * Purpose: Retrieves a public thread for sharing without requiring authentication.
 * Includes sharer information (name, avatar) for display.
 * How it's used: Called when someone accesses a shared thread via /share/threadId.
 */
export const getPublicThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .first();

    if (!thread) return null;

    // Get sharer information
    const sharer = await ctx.db.get(thread.userId as any);
    
    return {
      ...thread,
      sharer: sharer ? {
        name: (sharer as any).name || "Anonymous",
        image: (sharer as any).image || "",
        email: (sharer as any).email || "",
      } : null
    };
  },
});

/**
 * threads.summarizeChat
 * 
 * Purpose: Summarizes all messages in a chat thread using Gemini 2.0 Flash.
 * How it's used: Called when user clicks the summary button to get an overview of the entire conversation.
 */
export const summarizeChat = internalQuery({
  args: { threadId: v.string(), userId: v.id("users") },
  handler: async (ctx, { threadId, userId }) => {
    // First check if the thread belongs to the user
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_and_threadId", (q) => 
        q.eq("userId", userId).eq("threadId", threadId)
      )
      .filter((q) => q.eq(q.field("visibility"), "visible"))
      .unique();

    if (!thread) return null;

    // Get all messages for the thread
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_userid", (q) => 
        q.eq("threadId", threadId).eq("userId", userId)
      )
      .order("desc")
      .collect();

    // Return the messages in chronological order for summary generation
    return {
      thread,
      messages: messages.reverse()
    };
  },
});
