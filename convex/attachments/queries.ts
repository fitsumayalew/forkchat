import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * attachments.getAttachment
 * 
 * Gets a single attachment by ID with its download URL.
 */
export const getAttachment = query({
  args: {
    attachmentId: v.id("attachments"),
  },
  handler: async (ctx, { attachmentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attachment = await ctx.db.get(attachmentId);
    if (!attachment || attachment.userId !== userId) {
      return null;
    }

    // Get the download URL from storage
    const url = await ctx.storage.getUrl(attachment.storageId);
    
    return {
      ...attachment,
      url,
    };
  },
});

/**
 * attachments.getAttachments
 * 
 * Gets multiple attachments by their IDs.
 */
export const getAttachments = query({
  args: {
    attachmentIds: v.array(v.id("attachments")),
  },
  handler: async (ctx, { attachmentIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attachments = await Promise.all(
      attachmentIds.map(async (id) => {
        const attachment = await ctx.db.get(id);
        if (!attachment || attachment.userId !== userId) {
          return null;
        }

        const url = await ctx.storage.getUrl(attachment.storageId);
        
        return {
          ...attachment,
          url,
        };
      })
    );

    // Filter out null attachments
    return attachments.filter(Boolean);
  },
});

/**
 * attachments.getUserAttachments
 * 
 * Gets all attachments for the current user.
 */
export const getUserAttachments = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .collect();

    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const url = await ctx.storage.getUrl(attachment.storageId);
        return {
          ...attachment,
          url,
        };
      })
    );

    return attachmentsWithUrls;
  },
}); 