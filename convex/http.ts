import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { streamText, ToolSet, TextStreamPart } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Redis } from "@upstash/redis";
import { models } from "../src/lib/models";

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const googleAI = createGoogleGenerativeAI({ apiKey });


const client = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const http = httpRouter();

// Add auth routes
auth.addHttpRoutes(http);

// CORS configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper function to generate Redis keys
function getStreamKey(messageId: string) {
  return `stream:${messageId}`;
}

function getStreamPartKey(messageId: string, partIndex: number) {
  return `stream:${messageId}:part:${partIndex}`;
}

function getStreamMetaKey(messageId: string) {
  return `stream:${messageId}:meta`;
}

// Helper function to clean up Redis data for a stream
async function cleanupStreamData(messageId: string) {
  try {
    const metaKey = getStreamMetaKey(messageId);
    const metaData = await client.get(metaKey);

    if (metaData) {
      const { totalParts } =
        typeof metaData === "string" ? JSON.parse(metaData) : metaData;

      // Delete all parts
      const partKeys = [];
      for (let i = 0; i < totalParts; i++) {
        partKeys.push(getStreamPartKey(messageId, i));
      }

      if (partKeys.length > 0) {
        await client.del(...partKeys);
      }

      // Delete metadata
      await client.del(metaKey);
    }
  } catch (error) {
    console.error("Error cleaning up stream data:", error);
  }
}

http.route({
  path: "/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      const {
        messages,
        modelParams,
        threadId,
        responseMessageId,
        model,
      }: {
        messages: {
          id: string;
          role: string;
          parts: {
            type: string;
            text: string;
          }[];
          attachments: string[];
        }[];
        model: string;
        modelParams: {
          reasoningEffort: string;
          includeSearch: boolean;
        };
        responseMessageId: string;
        threadId: string;
      } = await request.json();

      // Create a TransformStream to handle streaming data
      let { readable, writable } = new TransformStream();
      let writer = writable.getWriter();
      const textEncoder = new TextEncoder();

      // get the model from the modelParams
      const modelData = models[model as keyof typeof models];
      if (!modelData) {
        throw new Error(`Model ${model} not found`);
      }

      const streamData = async () => {
        let content = "";
        let reasoning = "";
        let partIndex = 0;

        // Initialize stream metadata in Redis
        const metaKey = getStreamMetaKey(responseMessageId);
        await client.set(
          metaKey,
          JSON.stringify({
            totalParts: 0,
            isComplete: false,
            startTime: Date.now(),
          }),
          { ex: 300 },
        ); // Expire after 5 minutes

        // Mark thread as generating
        await ctx.runMutation(internal.threads.mutations.updateThread, {
          threadId,
          generationStatus: "generating",
        });


        console.log("===messages===");
        console.log(messages);

        // Use the provided messages array for the conversation context
        const formattedMessages = messages
          .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
          .map((msg: any) => ({
            role: msg.role as "user" | "assistant",
            content:
              msg.parts
                ?.map((part: any) => (part.type === "text" ? part.text : ""))
                .join("") || "",
          }));

        const systemPrompt = `
          You are an AI assistant called ForkChat.
          You are a helpful assistant that can help with a wide range of tasks.
          Be very friendly and engaging.
          Be humorous and fun.
          You are able to understand the user's intent and provide a helpful response.
          If you are not sure about the user's intent, you can ask for more information.
          Don't ever reply with an empty message.
          ${modelParams?.reasoningEffort ? `Use ${modelParams.reasoningEffort} reasoning effort in your responses.` : ""}
          ${modelParams?.includeSearch ? "Include relevant search context when appropriate." : ""}
        `;


        try {

        let fullStream: AsyncIterableStream<TextStreamPart<ToolSet>>;

        if (modelData.provider === "Google") {
          const response = streamText({
            model: googleAI(modelData.id),
            messages: formattedMessages,
            system: systemPrompt.trim(),
          });
          fullStream = response.fullStream;
        } else if (modelData.provider === "OpenRouter") {
          const response = streamText({
            model:  openrouter(modelData.id),
            messages: formattedMessages,
            system: systemPrompt.trim(),
          });
          fullStream = response.fullStream;
        } else {
          throw new Error(`Model ${model} not found`);
        }

      

      

          for await (const part of fullStream) {
            // Store each part in Redis
            const partKey = getStreamPartKey(responseMessageId, partIndex);
            const partData = {
              index: partIndex,
              part,
              timestamp: Date.now(),
            };

            await client.set(partKey, JSON.stringify(partData), { ex: 3600 }); // Expire after 1 hour

            // Serialize the part as JSON and write to stream
            const partJson = JSON.stringify(part) + "\n";
            await writer.write(textEncoder.encode(partJson));

            if (part.type === "text-delta") {
              content += part.textDelta;
            }

            if (part.type === "reasoning") {
              reasoning += part.textDelta;
            }

            partIndex++;

            // Update metadata with current part count
            await client.set(
              metaKey,
              JSON.stringify({
                totalParts: partIndex,
                isComplete: false,
                startTime: Date.now(),
              }),
              { ex: 3600 },
            );

            // Update database periodically (at sentence endings, commas, etc.)
            if (hasDelimiter(content) || content.length % 50 === 0) {
              await ctx.runMutation(
                internal.messages.mutations.updateStreamingContent,
                {
                  messageId: responseMessageId,
                  content,
                  isComplete: false,
                },
              );
            }
          }

          // Final update to mark as complete
          await ctx.runMutation(
            internal.messages.mutations.updateStreamingContent,
            {
              messageId: responseMessageId,
              content,
              isComplete: true,
            },
          );

          // Mark stream as complete in Redis metadata
          await client.set(
            metaKey,
            JSON.stringify({
              totalParts: partIndex,
              isComplete: true,
              startTime: Date.now(),
            }),
            { ex: 300 },
          ); // Keep for 5 minutes after completion for potential late reconnects
        } catch (streamError) {
          console.error("Error in AI streaming:", streamError);
          throw streamError;
        } finally {
          await writer.close();

          // Clean up Redis data after a short delay to allow for potential reconnects
          setTimeout(async () => {
            await cleanupStreamData(responseMessageId);
          }, 300000); // 5 minutes
        }
      };

      // Start streaming but don't await it immediately
      void streamData();

      // Return the readable stream with CORS headers
      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (error) {
      console.error("Error in streaming handler:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// Resume streaming endpoint
http.route({
  path: "/chat/resume",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const {
        responseMessageId,
        lastReceivedPartIndex = -1,
      }: {
        responseMessageId: string;
        lastReceivedPartIndex?: number;
      } = await request.json();

      // Check if stream data exists in Redis
      const metaKey = getStreamMetaKey(responseMessageId);
      const metaData = await client.get(metaKey);

      if (!metaData) {
        return new Response(
          JSON.stringify({ error: "Stream data not found or expired" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { totalParts, isComplete } =
        typeof metaData === "string" ? JSON.parse(metaData) : metaData;
      const startIndex = lastReceivedPartIndex + 1;

      // Create a TransformStream for resuming
      let { readable, writable } = new TransformStream();
      let writer = writable.getWriter();
      const textEncoder = new TextEncoder();

      const resumeStream = async () => {
        try {
          // Stream remaining parts
          for (let i = startIndex; i < totalParts; i++) {
            const partKey = getStreamPartKey(responseMessageId, i);
            const partData = await client.get(partKey);

            if (partData) {
              const { part } =
                typeof partData === "string" ? JSON.parse(partData) : partData;
              const partJson = JSON.stringify(part) + "\n";
              await writer.write(textEncoder.encode(partJson));
            }
          }

          // If the original stream is complete, clean up Redis data
          if (isComplete) {
            await cleanupStreamData(responseMessageId);
          }
        } catch (error) {
          console.error("Error resuming stream:", error);
        } finally {
          await writer.close();
        }
      };

      // Start resume streaming
      void resumeStream();

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (error) {
      console.error("Error in resume handler:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// Handle CORS preflight for all routes
http.route({
  path: "/chat",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 200, headers: corsHeaders });
  }),
});

http.route({
  path: "/chat/resume",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 200, headers: corsHeaders });
  }),
});

export default http;

function hasDelimiter(content: string) {
  return /[.!?;,\n]/.test(content);
}
