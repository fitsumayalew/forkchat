import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";



// Schema for individual parts of a message, supporting different content types.
export const partSchema = v.union(
  v.object({ type: v.literal("text"), text: v.string() }),
  v.object({ type: v.literal("reasoning"), reasoning: v.string() }),
  v.object({
    type: v.literal("tool_call"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    toolCallId: v.string(),
    toolName: v.string(),
    args: v.any(),
    result: v.optional(v.any()),
  }),
);

// / Schema for the status of a message.
export const messageStatus = v.union(
  v.literal("waiting"),
  v.literal("thinking"),
  v.literal("streaming"),
  v.literal("done"),
  v.literal("error"),
  v.literal("error.rejected"),
  v.literal("deleted"),
  v.literal("cancelled"),
);

// Schema for model-specific parameters.
const modelParametersSchema = v.object({
  temperature: v.optional(v.number()),
  topP: v.optional(v.number()),
  topK: v.optional(v.number()),
  reasoningEffort: v.optional(
    v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  ),
  includeSearch: v.optional(v.boolean()),
});



// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,

  // Table to store folders.
  folders: defineTable({
    name: v.string(),
    // Optional: for nested folders in the future
    parentId: v.optional(v.id("folders")),
    // Optional: for custom ordering
    order: v.optional(v.number()),
    userId: v.string(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),
  // Table to store conversation threads.
  threads: defineTable({
    threadId: v.string(),
    title: v.string(),
    updatedAt: v.number(),
    lastMessageAt: v.number(),
    generationStatus: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    visibility: v.union(v.literal("visible"), v.literal("archived")),
    isPublic: v.optional(v.boolean()),
    userSetTitle: v.optional(v.boolean()),
    userId: v.string(),
    folderId: v.optional(v.id("folders")),
    model: v.string(),
    pinned: v.boolean(),
    branchParentThreadId: v.optional(v.id("threads")),
    branchParentMessageId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_threadId", ["threadId"])
    .index("by_user_and_threadId", ["userId", "threadId"])
    .index("by_userId_and_updatedAt", ["userId", "updatedAt"])
    .index("by_user_and_pinned", ["userId", "pinned"])
    .index("by_public_threads", ["isPublic"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId"],
    }),

  // Table to store individual messages within threads.
  messages: defineTable({
    messageId: v.string(),
    threadId: v.string(),
    userId: v.string(),
    reasoning: v.optional(v.string()),
    parts: v.optional(v.array(partSchema)),
    status: messageStatus,
    updated_at: v.optional(v.number()),
    branches: v.optional(v.array(v.id("threads"))),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    created_at: v.number(),
    serverError: v.optional(
      v.object({ type: v.string(), message: v.string() }),
    ),
    model: v.string(),
    attachmentIds: v.array(v.id("attachments")),
    modelParams: v.optional(modelParametersSchema),
    providerMetadata: v.optional(v.record(v.string(), v.any())),
    resumableStreamId: v.optional(v.string()),
    tokensPerSecond: v.optional(v.number()),
    timeToFirstToken: v.optional(v.number()),
    tokens: v.optional(v.number()),
  })
    .index("by_threadId", ["threadId"])
    .index("by_thread_and_userid", ["threadId", "userId"])
    .index("by_messageId_and_userId", ["messageId", "userId"])
    .index("by_user", ["userId"]),

  // Table to store file attachments.
  attachments: defineTable({
    userId: v.string(),
    // The original name of the file as it was on the user's computer.
    fileName: v.string(),
    // The MIME type of the file (e.g., 'image/png', 'application/pdf').
    mimeType: v.string(),
    // The type of attachment (e.g., 'image', 'file', 'text').
    attachmentType: v.string(),
    // The size of the file in bytes.
    fileSize: v.number(),
    storageId: v.id("_storage"), // Convex storage file ID
    publicMessageIds: v.optional(v.array(v.id("messages"))), // Messages that reference this attachment
    status: v.optional(v.union(v.literal("deleted"), v.literal("uploaded"))),
  })
    .index("by_userId", ["userId"])
    .index("by_storageId", ["storageId"]),

  // Table for user-specific configuration and settings.
  userConfiguration: defineTable({
    userId: v.string(),
    theme: v.optional(v.string()),
    currentlySelectedModel: v.optional(v.string()),
    currentModelParameters: v.optional(modelParametersSchema),
    favoriteModels: v.optional(v.array(v.string())),
  }).index("by_userId", ["userId"]),

  // Table for user-specific prompt customizations.
  userPromptCustomization: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    occupation: v.optional(v.string()),
    selectedTraits: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
