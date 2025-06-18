import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * folders.create
 * 
 * Purpose: Creates a new, empty folder.
 * How it's used: Called when the user clicks the "Create Folder" button. It would likely prompt 
 * for a name and then call this mutation with { name: "My New Folder" }.
 */
export const create = mutation({
  args: {
    name: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { name, order }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate folder name
    if (!name.trim()) {
      throw new Error("Folder name cannot be empty");
    }

    // Check total folder count - limit to 10 per user
    const userFolders = await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (userFolders.length >= 10) {
      throw new Error("Maximum of 10 folders allowed per user");
    }

    // Check if a folder with the same name already exists for this user
    // const existingFolder = userFolders.find(folder => folder.name === name.trim());

    // if (existingFolder) {
    //   throw new Error("A folder with this name already exists");
    // }

    // Create the folder (no sub-folders allowed)
    const folderId = await ctx.db.insert("folders", {
      name: name.trim(),
      userId,
      updatedAt: Date.now(),
      ...(order !== undefined && { order }),
    });

    return { success: true, folderId } as const;
  },
});

/**
 * folders.rename
 * 
 * Purpose: Changes the name of an existing folder.
 * How it's used: Called when a user renames a folder through its context menu or by 
 * double-clicking its name.
 */
export const rename = mutation({
  args: {
    folderId: v.id("folders"),
    name: v.string(),
  },
  handler: async (ctx, { folderId, name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate folder name
    if (!name.trim()) {
      throw new Error("Folder name cannot be empty");
    }

    // Find the folder and verify ownership
    const folder = await ctx.db.get(folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found or access denied");
    }

    // Check if another folder with the same name already exists for this user
    const existingFolder = await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.and(
        q.eq(q.field("name"), name.trim()),
        q.neq(q.field("_id"), folderId)
      ))
      .first();

    if (existingFolder) {
      throw new Error("A folder with this name already exists");
    }

    // Update the folder name
    await ctx.db.patch(folderId, {
      name: name.trim(),
      updatedAt: Date.now(),
    });

    return { success: true } as const;
  },
});

/**
 * folders.remove
 * 
 * Purpose: Deletes a folder. The backend logic for this mutation is crucial: it must also handle 
 * the threads inside that folder.
 * How it's used: Called when a user deletes a folder from its context menu. The backend 
 * implementation will set folderId to undefined for all threads within that folder before 
 * deleting the folder itself, ensuring no threads are lost.
 */
export const remove = mutation({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, { folderId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the folder and verify ownership
    const folder = await ctx.db.get(folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found or access denied");
    }

    // Move all threads out of this folder by setting their folderId to undefined
    const threadsInFolder = await ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("folderId"), folderId))
      .collect();

    for (const thread of threadsInFolder) {
      await ctx.db.patch(thread._id, {
        folderId: undefined,
        updatedAt: Date.now(),
      });
    }

    // Delete the folder
    await ctx.db.delete(folderId);

    return { 
      success: true, 
      movedThreadsCount: threadsInFolder.length 
    } as const;
  },
});

/**
 * folders.reorder
 * 
 * Purpose: Reorders folders by updating their order values.
 * How it's used: Called when a user drags and drops folders to reorder them.
 */
export const reorder = mutation({
  args: {
    folderId: v.id("folders"),
    newOrder: v.number(),
  },
  handler: async (ctx, { folderId, newOrder }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the folder and verify ownership
    const folder = await ctx.db.get(folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found or access denied");
    }

    // Update the folder's order
    await ctx.db.patch(folderId, {
      order: newOrder,
      updatedAt: Date.now(),
    });

    return { success: true } as const;
  },
});

/**
 * folders.bulkReorder
 * 
 * Purpose: Reorders multiple folders in a single transaction.
 * How it's used: Called when reordering affects multiple folders at once.
 */
export const bulkReorder = mutation({
  args: {
    updates: v.array(v.object({
      folderId: v.id("folders"),
      order: v.number(),
    })),
  },
  handler: async (ctx, { updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify ownership of all folders and update them
    for (const { folderId, order } of updates) {
      const folder = await ctx.db.get(folderId);
      if (!folder || folder.userId !== userId) {
        throw new Error(`Folder ${folderId} not found or access denied`);
      }

      await ctx.db.patch(folderId, {
        order,
        updatedAt: Date.now(),
      });
    }

    return { success: true, updatedCount: updates.length } as const;
  },
});
