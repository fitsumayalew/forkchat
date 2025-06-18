import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * folders.get
 * 
 * Purpose: Fetches all folders created by the current user.
 * How it's used: This query runs alongside threads.get. The client uses this list to render 
 * the collapsible FolderItem components in the "Folders" section of the sidebar.
 */
export const get = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by order (ascending), then by creation time (desc) for folders without order
    return folders.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined && b.order === undefined) {
        return -1; // folders with order come first
      }
      if (a.order === undefined && b.order !== undefined) {
        return 1; // folders without order come last
      }
      // Both have no order, sort by creation time (newest first)
      return b._creationTime - a._creationTime;
    });
  },
});
