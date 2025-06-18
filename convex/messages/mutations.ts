import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { messageStatus, partSchema } from "../schema";

/**
 * messages.addMessagesToThread
 *
 * Adds new user and assistant messages to a thread. This is the core of the chat functionality.
 */
export const addMessagesToThread = mutation({
  args: {
    threadId: v.string(),
    userMessage: v.object({
      content: v.string(),
      model: v.string(),
      attachmentIds: v.optional(v.array(v.id("attachments"))),
      modelParams: v.optional(
        v.object({
          temperature: v.optional(v.number()),
          topP: v.optional(v.number()),
          topK: v.optional(v.number()),
          reasoningEffort: v.optional(
            v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
          ),
          includeSearch: v.optional(v.boolean()),
        }),
      ),
    }),
    assistantMessage: v.optional(
      v.object({
        content: v.optional(v.string()),
        status: v.optional(
          v.union(
            v.literal("waiting"),
            v.literal("thinking"),
            v.literal("streaming"),
            v.literal("done"),
            v.literal("error"),
            v.literal("error.rejected"),
            v.literal("deleted"),
            v.literal("cancelled"),
          ),
        ),
        resumableStreamId: v.optional(v.string()),
      }),
    ),
    newThread: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { threadId, userMessage, assistantMessage: _assistantMessage, newThread },
  ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if thread exists
    let thread = await ctx.db
      .query("threads")
      .withIndex("by_user_and_threadId", (q) =>
        q.eq("userId", userId).eq("threadId", threadId),
      )
      .unique();

    // Create new thread if it doesn't exist and newThread flag is set
    if (!thread && newThread) {
      const now = Date.now();

      // Generate a title from the first few words of the user message
      const title = "New Chat"

      const threadData = {
        threadId,
        title,
        updatedAt: now,
        lastMessageAt: now,
        generationStatus: "generating" as const,
        visibility: "visible" as const,
        userId,
        model: userMessage.model,
        pinned: false,
        userSetTitle: false,
      };

      const threadRef = await ctx.db.insert("threads", threadData);

      // Fetch the newly created thread
      thread = await ctx.db.get(threadRef);
      if (!thread) throw new Error("Failed to create thread");
    }

    if (!thread) {
      throw new Error("Thread not found or access denied");
    }

    const now = Date.now();
    const userMessageId = crypto.randomUUID();

    // Create user message
    const userMessageData = {
      messageId: userMessageId,
      threadId,
      userId,
      parts: [{ type: "text" as const, text: userMessage.content }],
      role: "user" as const,
      status: "done" as const,
      model: userMessage.model,
      attachmentIds: userMessage.attachmentIds || [],
      modelParams: userMessage.modelParams,
      created_at: now,
      updated_at: now,
    };

    await ctx.db.insert("messages", userMessageData);

    const assistantMessageId = crypto.randomUUID();

    const messageId = await ctx.db.insert("messages", {
      messageId: assistantMessageId,
      threadId,
      userId,
      parts: [],
      role: "assistant" as const,
      status: "waiting" as const,
      model: userMessage.model,
      attachmentIds: [],
      created_at: now,
      updated_at: now,
      modelParams: userMessage.modelParams,
    });

    await ctx.db.patch(thread._id, {
      updatedAt: now,
      lastMessageAt: now,
    });

    // Fetch all messages including the newly created assistant message
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_userid", (q) =>
        q.eq("threadId", threadId).eq("userId", userId),
      )
      .order("asc")
      .collect();

    ctx.scheduler.runAfter(0, internal.ai.chat.chat, { messages, messageId, shouldGenerateTitle: !!newThread});

    return {
      success: true,
      userMessageId,
      assistantMessageId,
    } as const;
  },
});

/**
 * messages.createBranch
 *
 * Creates a new conversation thread by branching off an existing message.
 */
export const createBranch = mutation({
  args: {
    originalThreadId: v.string(),
    branchFromMessageId: v.string(),
  },
  handler: async (
    ctx,
    { originalThreadId, branchFromMessageId },
  ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify original thread exists and user has access
    const originalThread = await ctx.db
      .query("threads")
      .withIndex("by_user_and_threadId", (q) =>
        q.eq("userId", userId).eq("threadId", originalThreadId),
      )
      .unique();

    if (!originalThread) {
      throw new Error("Original thread not found or access denied");
    }

    // Verify the message exists in the thread
    const branchMessage = await ctx.db
      .query("messages")
      .withIndex("by_messageId_and_userId", (q) =>
        q.eq("messageId", branchFromMessageId).eq("userId", userId),
      )
      .unique();

    if (!branchMessage || branchMessage.threadId !== originalThreadId) {
      throw new Error(
        "Branch message not found or not in the specified thread",
      );
    }

    // Get all messages up to and including the branch point
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_userid", (q) =>
        q.eq("threadId", originalThreadId).eq("userId", userId),
      )
      .order("asc")
      .collect();

    const branchPointIndex = allMessages.findIndex(
      (msg) => msg.messageId === branchFromMessageId,
    );
    if (branchPointIndex === -1) {
      throw new Error("Branch message not found in thread");
    }

    const messagesToCopy = allMessages.slice(0, branchPointIndex + 1);

    const now = Date.now();
    const newThreadId = crypto.randomUUID();

    // Create new thread
    const newThread = {
      threadId: newThreadId,
      title: originalThread.title,
      updatedAt: now,
      lastMessageAt: now,
      generationStatus: "completed" as const,
      visibility: "visible" as const,
      userId,
      model: originalThread.model,
      pinned: false,
      branchParentThreadId: originalThread._id,
      branchParentMessageId: branchFromMessageId,
    };

    const newThreadRef = await ctx.db.insert("threads", newThread);

    // Copy messages to new thread
    for (const message of messagesToCopy) {
      const newMessageId = crypto.randomUUID();
      const newMessage = {
        ...message,
        messageId: newMessageId,
        threadId: newThreadId,
        created_at: now,
        updated_at: now,
        _id: undefined, // Remove the original _id
        _creationTime: undefined, // Remove the original _creationTime
      };
      delete newMessage._id;
      delete newMessage._creationTime;

      await ctx.db.insert("messages", newMessage);
    }

    // Update original message to track this branch
    const existingBranches = branchMessage.branches || [];
    await ctx.db.patch(branchMessage._id, {
      branches: [...existingBranches, newThreadRef],
    });

    return {
      success: true,
      newThreadId,
      branchedFromMessageId: branchFromMessageId,
    } as const;
  },
});

/**
 * messages.editMessage
 *
 * Edits an existing user message and triggers a new response from the AI.
 */
export const editMessage = mutation({
  args: {
    messageId: v.string(),
    newContent: v.string(),
    model: v.optional(v.string()),
    modelParams: v.optional(
      v.object({
        temperature: v.optional(v.number()),
        topP: v.optional(v.number()),
        topK: v.optional(v.number()),
        reasoningEffort: v.optional(
          v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        ),
        includeSearch: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (
    ctx,
    { messageId, newContent: _newContent, model, modelParams },
  ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the message to edit
    const message = await ctx.db
      .query("messages")
      .withIndex("by_messageId_and_userId", (q) =>
        q.eq("messageId", messageId).eq("userId", userId),
      )
      .unique();

    if (!message) {
      throw new Error("Message not found or access denied");
    }

    if (message.role !== "user") {
      throw new Error("Only user messages can be edited");
    }

    // Get all messages in the thread
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_userid", (q) =>
        q.eq("threadId", message.threadId).eq("userId", userId),
      )
      .order("asc")
      .collect();

    const messageIndex = allMessages.findIndex(
      (msg) => msg.messageId === messageId,
    );
    if (messageIndex === -1) {
      throw new Error("Message not found in thread");
    }

    // Delete all messages after the edited message
    const messagesToDelete = allMessages.slice(messageIndex + 1);
    for (const msgToDelete of messagesToDelete) {
      await ctx.db.delete(msgToDelete._id);
    }

    const now = Date.now();

    // Update the user message
    await ctx.db.patch(message._id, {
      updated_at: now,
      model: model || message.model,
      modelParams: modelParams || message.modelParams,
      parts: [{ type: "text" as const, text: _newContent }],
    });

    // Create a new assistant message for the AI response
    const assistantMessageId = crypto.randomUUID();
    const assistantMessageData = {
      messageId: assistantMessageId,
      threadId: message.threadId,
      userId,
      role: "assistant" as const,
      status: "waiting" as const,
      model: model || message.model,
      attachmentIds: [],
      created_at: now,
      updated_at: now,
    };

    const assistantMessage = await ctx.db.insert("messages", assistantMessageData);

    // Update thread status
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_and_threadId", (q) =>
        q.eq("userId", userId).eq("threadId", message.threadId),
      )
      .unique();

    if (thread) {
      await ctx.db.patch(thread._id, {
        generationStatus: "generating",
        updatedAt: now,
        lastMessageAt: now,
      });
    }

    // Refetch all messages including the newly created assistant message
    const updatedMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_userid", (q) =>
        q.eq("threadId", message.threadId).eq("userId", userId),
      )
      .order("asc")
      .collect();

    ctx.scheduler.runAfter(0, internal.ai.chat.chat, { messages: updatedMessages, messageId: assistantMessage, shouldGenerateTitle: false});

    return {
      success: true,
      editedMessageId: messageId,
      newAssistantMessageId: assistantMessageId,
    } as const;
  },
});

/**
 * messages.setErrorMessage
 *
 * Sets an error state on a message if the AI generation fails.
 */
export const setErrorMessage = mutation({
  args: {
    messageId: v.string(),
    errorType: v.string(),
    errorMessage: v.string(),
    status: v.optional(
      v.union(v.literal("error"), v.literal("error.rejected")),
    ),
  },
  handler: async (
    ctx,
    { messageId, errorType, errorMessage, status = "error" },
  ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the message
    const message = await ctx.db
      .query("messages")
      .withIndex("by_messageId_and_userId", (q) =>
        q.eq("messageId", messageId).eq("userId", userId),
      )
      .unique();

    if (!message) {
      throw new Error("Message not found or access denied");
    }

    const now = Date.now();

    // Update message with error details
    await ctx.db.patch(message._id, {
      status,
      serverError: {
        type: errorType,
        message: errorMessage,
      },
      updated_at: now,
    });

    // Update thread generation status
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_and_threadId", (q) =>
        q.eq("userId", userId).eq("threadId", message.threadId),
      )
      .unique();

    if (thread) {
      await ctx.db.patch(thread._id, {
        generationStatus: "failed",
        updatedAt: now,
      });
    }

    return { success: true, messageId } as const;
  },
});

/**
 * messages.stopGeneration
 *
 * Stops an in-progress AI message generation for a specific thread.
 */
export const stopGeneration = mutation({
  args: {
    threadId: v.string(),
    messageId: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, messageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify thread exists and user has access
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_and_threadId", (q) =>
        q.eq("userId", userId).eq("threadId", threadId),
      )
      .unique();

    if (!thread) {
      throw new Error("Thread not found or access denied");
    }

    let targetMessage;

    if (messageId) {
      // Stop specific message
      targetMessage = await ctx.db
        .query("messages")
        .withIndex("by_messageId_and_userId", (q) =>
          q.eq("messageId", messageId).eq("userId", userId),
        )
        .unique();

      if (!targetMessage || targetMessage.threadId !== threadId) {
        throw new Error("Message not found or not in the specified thread");
      }
    } else {
      // Find the last assistant message that's being generated
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_thread_and_userid", (q) =>
          q.eq("threadId", threadId).eq("userId", userId),
        )
        .order("desc")
        .collect();

      targetMessage = messages.find(
        (msg) =>
          msg.role === "assistant" &&
          ["waiting", "thinking", "streaming"].includes(msg.status),
      );
    }

    if (!targetMessage) {
      throw new Error("No message being generated found");
    }

    const now = Date.now();

    // Update message status to cancelled
    await ctx.db.patch(targetMessage._id, {
      status: "cancelled",
      updated_at: now,
    });

    // Update thread generation status
    await ctx.db.patch(thread._id, {
      generationStatus: "completed",
      updatedAt: now,
    });

    return {
      success: true,
      stoppedMessageId: targetMessage.messageId,
      resumableStreamId: targetMessage.resumableStreamId,
    } as const;
  },
});

// Updates a message with a new body.
export const updateMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
    parts: v.optional(v.array(partSchema)),
    status: v.optional(messageStatus),
  },
  handler: async (ctx, { messageId, parts, status }) => {
    await ctx.db.patch(messageId, { parts, ...(status && { status }) });
  },
});

// Updates a message with streaming content during HTTP streaming
export const updateStreamingContent = internalMutation({
  args: {
    messageId: v.string(),
    content: v.string(),
    isComplete: v.boolean(),
  },
  handler: async (ctx, { messageId, content, isComplete }) => {
    // Find the message by messageId - need to query without userId since this is internal
    const message = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("messageId"), messageId))
      .unique();

    if (!message) {
      throw new Error("Message not found");
    }

    const now = Date.now();

    // Update the message with new content
    await ctx.db.patch(message._id, {
      parts: [{ type: "text" as const, text: content }],
      status: isComplete ? "done" as const : "streaming" as const,
      updated_at: now,
    });

    // If complete, update the thread status as well
    if (isComplete) {
      const thread = await ctx.db
        .query("threads")
        .filter((q) => q.eq(q.field("threadId"), message.threadId))
        .unique();

      if (thread) {
        await ctx.db.patch(thread._id, {
          generationStatus: "completed" as const,
          updatedAt: now,
          lastMessageAt: now,
        });
      }
    }
  },
});
