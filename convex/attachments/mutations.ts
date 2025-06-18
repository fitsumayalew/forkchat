import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * attachments.uploadFile
 * 
 * Stores file metadata after a file has been uploaded to Convex storage.
 * This is called after the client uploads the file to storage.
 */
export const uploadFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    attachmentType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate file types - only allow images and PDFs
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // PDFs
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(args.mimeType)) {
      throw new Error("File type not allowed. Only images and PDFs are supported.");
    }

    // Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    if (args.fileSize > maxFileSize) {
      throw new Error("File size too large. Maximum size is 10MB.");
    }

    // Verify the file exists in storage
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new Error("File not found in storage");
    }

    // Create attachment record
    const attachmentId = await ctx.db.insert("attachments", {
      userId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      attachmentType: args.attachmentType,
      fileSize: args.fileSize,
      storageId: args.storageId,
      status: "uploaded",
      publicMessageIds: [],
    });

    return { attachmentId, success: true };
  },
});

/**
 * attachments.deleteFile
 * 
 * Deletes an attachment and its associated storage file.
 */
export const deleteFile = mutation({
  args: {
    attachmentId: v.id("attachments"),
  },
  handler: async (ctx, { attachmentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the attachment
    const attachment = await ctx.db.get(attachmentId);
    if (!attachment || attachment.userId !== userId) {
      throw new Error("Attachment not found or access denied");
    }

    // Delete from storage
    await ctx.storage.delete(attachment.storageId);

    // Delete the attachment record
    await ctx.db.delete(attachmentId);

    return { success: true };
  },
});

/**
 * attachments.generateUploadUrl
 * 
 * Generates an upload URL for the client to upload files directly to Convex storage.
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
}); 