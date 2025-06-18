// import { OpenAI } from "openai";
import { action, internalAction } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { generateText, streamText, TextStreamPart, ToolSet } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { getAuthUserId } from "@convex-dev/auth/server";
import { models } from "../../src/lib/models";
import { v } from "convex/values";

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

// Models configuration (should match src/lib/models.ts structure)


/**
 * Builds a personalized system prompt based on user configuration and customization
 */
function buildSystemPrompt(userConfig: any, userCustomization: any): string {
  let systemPrompt = `You are an AI assistant called ForkChat.
You are a helpful assistant that can help with a wide range of tasks.
Be very friendly and engaging.
Be humorous and fun.
You are able to understand the user's intent and provide a helpful response.
If you are not sure about the user's intent, you can ask for more information.
Don't ever reply with an empty message.`;

  // Add personalization based on user profile
  if (userCustomization) {
    const personalizations = [];
    
    if (userCustomization.name) {
      personalizations.push(`The user's name is ${userCustomization.name}.`);
    }
    
    if (userCustomization.occupation) {
      personalizations.push(`Their occupation is ${userCustomization.occupation}.`);
    }
    
    if (userCustomization.selectedTraits && userCustomization.selectedTraits.length > 0) {
      const traits = userCustomization.selectedTraits.join(", ");
      personalizations.push(`They describe themselves as: ${traits}.`);
    }
    
    if (userCustomization.additionalInfo) {
      personalizations.push(`Additional context about them: ${userCustomization.additionalInfo}`);
    }
    
    if (personalizations.length > 0) {
      systemPrompt += `\n\nPersonal Context:\n${personalizations.join(" ")} Tailor your responses to be helpful for someone with this background, but keep your personality consistent.`;
    }
  }

  return systemPrompt;
}

export async function generateTitle({
  userMessage,
  aiMessage,
}: {
  userMessage: string,
  aiMessage: string,
}) {

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

  const googleAI = createGoogleGenerativeAI({ apiKey });

  const model =  googleAI('gemini-2.0-flash');
  const response = await generateText({
      model,
      system: `
              System Prompt:
                  You are an AI assistant that generates concise and engaging titles for chat conversations. Your goal is to analyze the first user message and the AI's response to create a relevant, clear, and compelling title that summarizes the core topic of the conversation.

              Guidelines for Title Generation:
                  •	Keep it short and clear (2-5 words).
                  •	Capture the essence of the discussion (e.g., "How to Build a React App" or "Tips for Learning German").
                  •	Avoid generic titles like "Chat Started" or "AI Conversation."
                  •	Make it engaging but informative, ensuring it reflects the topic accurately.
                  •	If uncertain, prioritize the user's intent based on their first message.

              Examples:
                  1.	User: "How can I improve my resume?"
              Title: "Resume Improvement Tips"
                  2.	User: "Explain quantum computing in simple terms."
              Title: "Beginner's Guide to Quantum Computing"
                  3.	User: "Tell me a joke."
              Title: "A Fun AI Joke"
                  4.	User: "What's the best way to cook pasta?"
              Title: "Perfect Pasta Cooking Tips"

              Output Format:
              Provide only the generated title, without extra explanations or adding quotes to the title.`,
      prompt: `
      User: ${userMessage}
      Assistant: ${aiMessage}
      `
  });

  return response.text;

}


type ChatParams = {
  messages: Doc<"messages">[];
  messageId: Id<"messages">;
  shouldGenerateTitle: boolean;
};

export const chat = internalAction({
  handler: async (ctx, { messages, messageId, shouldGenerateTitle }: ChatParams) => {
    console.log(messages);
    console.log("about to stream");
    
    try {
      // Get user ID from the first message
      const userId = messages[0]?.userId;
      if (!userId) {
        throw new Error("No user ID found in messages");
      }

      // Fetch user configuration and prompt customization
      const userConfig = await ctx.runQuery(internal.account.queries.getUserConfigurationInternal, { userId });
      const userCustomization = await ctx.runQuery(internal.account.queries.getUserPromptCustomizationInternal, { userId });

      // Get the selected model from user configuration
      const selectedModelId = userConfig?.currentlySelectedModel || "gpt-4o-mini";
      const modelData = models[selectedModelId as keyof typeof models];
      
      if (!modelData) {
        throw new Error(`Model ${selectedModelId} not found`);
      }

      const formattedMessages = messages
        .filter(
          ({ role, parts }) =>
            (role === "user" || role === "assistant") &&
            (parts &&
            parts.length > 0 &&
            parts.some((part) => part.type === "text")),
        )
        .map(({ parts, _creationTime, role }) => ({
          role: role as "user" | "assistant",
          content: parts!.map((part) => (part.type === "text" ? part.text : ""))
            .join("\n"),
          createdAt: _creationTime,
        }));
        console.log(formattedMessages);

        await ctx.runMutation(internal.messages.mutations.updateMessage, {
          messageId,
          status: "streaming",
        });
        
        let content = "";
 
        // Build personalized system prompt
        const systemPrompt = buildSystemPrompt(userConfig, userCustomization);

        let fullStream: AsyncIterableStream<TextStreamPart<ToolSet>>;

        if (modelData.provider === "Google") {
          const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
          const googleAI = createGoogleGenerativeAI({ apiKey });
          const response = streamText({
            model: googleAI(modelData.id),
            messages: formattedMessages,
            system: systemPrompt.trim(),
          });
          fullStream = response.fullStream;
        } else if (modelData.provider === "OpenRouter") {
          const response = streamText({
            model:  openrouter(`${modelData.developer.toLowerCase()}/${modelData.id}`),
            messages: formattedMessages,
            system: systemPrompt.trim(),
          });
          fullStream = response.fullStream;
        } else {
          throw new Error(`Provider ${modelData.provider} not supported. Supported providers: Google, OpenRouter`);
        }

        console.log("about to send stream");
        for await (const part of fullStream) {
          console.log(part);
          if (part.type === "text-delta") {
            content += part.textDelta;
            await ctx.runMutation(internal.messages.mutations.updateMessage, {
              messageId,
              parts: [{ type: "text", text: content }],
            });
          }
       
        }

        
        // finish the message
        await ctx.runMutation(internal.messages.mutations.updateMessage, {
          messageId,
          status: "done",
          parts: [{ type: "text", text: content }],
        });
        
        if (shouldGenerateTitle) {
          const title = await generateTitle({ userMessage: formattedMessages[0].content, aiMessage: content });
          await ctx.runMutation(internal.threads.mutations.updateThread, {
            threadId: messages[0].threadId as Id<"threads">,
            title,
          });
        }
        
        await ctx.runMutation(internal.threads.mutations.updateThread, {
          threadId: messages[0].threadId as Id<"threads">,
          generationStatus: "completed",
        });
        
        console.log("done streaming");
    } catch (e) {
      await ctx.runMutation(internal.threads.mutations.updateThread, {
        threadId: messages[0].threadId as Id<"threads">,
        generationStatus: "failed",
      });
      await ctx.runMutation(internal.messages.mutations.updateMessage, {
        messageId,
        status: "error",
      });
        console.error(e);
    }
  },
});

/**
 * Generates a summary of an entire chat conversation using Gemini 2.0 Flash
 */
export const generateChatSummary = internalAction({
  handler: async (_ctx, { messages }: { messages: Doc<"messages">[] }) => {
    try {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
      const googleAI = createGoogleGenerativeAI({ apiKey });
      
      // Format messages for summary generation
      const formattedMessages = messages
        .filter(({ role, parts }) =>
          (role === "user" || role === "assistant") &&
          (parts && parts.length > 0 && parts.some((part) => part.type === "text"))
        )
        .map(({ parts, role, _creationTime }) => ({
          role: role as "user" | "assistant",
          content: parts!.map((part) => (part.type === "text" ? part.text : "")).join("\n"),
          timestamp: new Date(_creationTime).toLocaleString()
        }));

      // Create conversation text for summary
      const conversationText = formattedMessages
        .map(msg => `[${msg.timestamp}] ${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n");

      const systemPrompt = `You are an AI assistant that creates comprehensive and insightful summaries of chat conversations. 

Your task is to analyze the entire conversation and provide a well-structured summary that captures:

1. **Main Topics**: The primary subjects discussed throughout the conversation
2. **Key Points**: Important information, decisions, or insights shared
3. **User Intent**: What the user was trying to accomplish or learn
4. **Outcomes**: Any solutions provided, questions answered, or tasks completed
5. **Context**: Any relevant background information that shaped the conversation

Guidelines for your summary:
- Be concise but comprehensive
- Use clear, organized formatting with headers and bullet points
- Highlight the most important information
- Maintain the chronological flow of topics if relevant
- Include any actionable items or next steps mentioned
- Keep the tone professional but accessible

Format your response as a structured summary with clear sections. Make it useful for someone who wants to quickly understand what was discussed without reading the entire conversation.`;

      const response = await generateText({
        model: googleAI('gemini-2.0-flash'),
        system: systemPrompt,
        prompt: `Please summarize the following conversation:\n\n${conversationText}`
      });

      return response.text;
    } catch (error) {
      console.error("Error generating chat summary:", error);
      throw new Error("Failed to generate chat summary");
    }
  }
});

/**
 * Refines and improves user prompts using Gemini 2.0 Flash
 */
export const refinePrompt = internalAction({
  handler: async (_ctx, { prompt, messages }: { prompt: string; messages?: Doc<"messages">[] }) => {
    try {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
      const googleAI = createGoogleGenerativeAI({ apiKey });

      // Build conversation context if messages are provided
      let conversationContext = "";
      if (messages && messages.length > 0) {
        const contextMessages = messages
          .filter(({ role, parts }) =>
            (role === "user" || role === "assistant") &&
            (parts && parts.length > 0 && parts.some((part) => part.type === "text"))
          )
          .slice(-10) // Only use last 10 messages for context to avoid token limits
          .map(({ parts, role }) => ({
            role: role as "user" | "assistant",
            content: parts!.map((part) => (part.type === "text" ? part.text : "")).join("\n"),
          }));

        if (contextMessages.length > 0) {
          conversationContext = `\n\nConversation context (recent messages):\n${contextMessages
            .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
            .join("\n\n")}\n\n`;
        }
      }

      const systemPrompt = `You are an AI assistant specializing in prompt refinement and optimization. Your task is to take user input and improve it to make it more clear, specific, and effective for AI interactions.

When refining prompts, you should:

1. **Clarify Intent**: Make the user's request more specific and actionable
2. **Add Context**: Include relevant details that would help generate better responses, considering the conversation history
3. **Improve Structure**: Organize the request in a logical, easy-to-follow manner
4. **Maintain Voice**: Keep the user's original tone and style preferences
5. **Add Specificity**: Include examples, constraints, or desired formats when helpful
6. **Consider Context**: Use the conversation history to better understand the user's intent and provide more relevant refinements

Guidelines:
- Keep the core intent and meaning of the original prompt
- Make it more specific and actionable without changing the fundamental request
- Add helpful context or constraints that would improve the response quality
- Use clear, concise language
- Consider the conversation history to provide contextually relevant improvements
- Don't make assumptions about information not provided
- If the prompt is already well-structured, make minimal improvements

Output only the refined prompt without any explanations or meta-commentary.`;

      const userPrompt = `Please refine and improve this prompt:${conversationContext}

Current prompt to refine: "${prompt}"`;

      const response = await generateText({
        model: googleAI('gemini-2.0-flash'),
        system: systemPrompt,
        prompt: userPrompt
      });

      return response.text;
    } catch (error) {
      console.error("Error refining prompt:", error);
      throw new Error("Failed to refine prompt");
    }
  }
});

/**
 * Public action to refine user prompts
 */
export const refineUserPrompt = action({
  args: {
    prompt: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { prompt, threadId }): Promise<{
    success: boolean;
    originalPrompt: string;
    refinedPrompt: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!prompt.trim()) {
      throw new Error("Prompt cannot be empty");
    }

    try {
      let messages: Doc<"messages">[] = [];
      
      // Fetch conversation context if threadId is provided
      if (threadId) {
        messages = await ctx.runQuery(internal.messages.queries.getByThreadIdInternal, {
          threadId,
          userId,
        });
      }

      // Call the internal action to refine the prompt
      const refinedPrompt: string = await ctx.runAction(internal.ai.chat.refinePrompt, {
        prompt: prompt.trim(),
        messages,
      });

      return {
        success: true,
        originalPrompt: prompt,
        refinedPrompt,
      };
    } catch (error) {
      console.error("Error refining prompt:", error);
      throw new Error("Failed to refine prompt. Please try again.");
    }
  },
});

/**
 * Generates custom theme colors using Gemini 2.0 Flash
 */
export const generateThemeColors = action({
  args: {
    description: v.string(),
  },
  handler: async (ctx, { description }): Promise<{
    success: boolean;
    theme: any;
    error?: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!description.trim()) {
      throw new Error("Theme description cannot be empty");
    }

    try {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
      const googleAI = createGoogleGenerativeAI({ apiKey });

      const systemPrompt = `You are an expert UI/UX designer and color theorist. Your task is to generate a complete color palette for a shadcn/ui theme based on user descriptions.

You must create both light and dark theme variants with colors that:
1. Have proper contrast ratios for accessibility (WCAG AA compliance)
2. Work harmoniously together
3. Follow modern design principles
4. Are provided in OKLCH color space format

Generate colors for these CSS variables:
- background: Main background color
- foreground: Main text color
- card: Card background
- card-foreground: Card text color
- popover: Popover background
- popover-foreground: Popover text color
- primary: Primary brand color
- primary-foreground: Text on primary color
- secondary: Secondary accent color
- secondary-foreground: Text on secondary color
- muted: Muted/subtle background
- muted-foreground: Muted text color
- accent: Accent color for highlights
- accent-foreground: Text on accent color
- destructive: Error/danger color
- border: Border color
- input: Input border color
- ring: Focus ring color
- chart-1: Chart color 1
- chart-2: Chart color 2
- chart-3: Chart color 3
- chart-4: Chart color 4
- chart-5: Chart color 5
- sidebar: Sidebar background
- sidebar-foreground: Sidebar text color
- sidebar-primary: Sidebar primary color
- sidebar-primary-foreground: Sidebar primary text color
- sidebar-accent: Sidebar accent color
- sidebar-accent-foreground: Sidebar accent text color
- sidebar-border: Sidebar border color
- sidebar-ring: Sidebar focus ring color

IMPORTANT: 
- Use OKLCH color space format like: oklch(0.216 0.006 56.043)
- Ensure proper contrast ratios
- Make the theme cohesive and visually appealing
- Provide both light and dark variants

Return ONLY a valid JSON object with this exact structure:
{
  "name": "Theme Name",
  "description": "Brief theme description",
  "light": {
    "background": "oklch(...)",
    "foreground": "oklch(...)",
    "card": "oklch(...)",
    "card-foreground": "oklch(...)",
    "popover": "oklch(...)",
    "popover-foreground": "oklch(...)",
    "primary": "oklch(...)",
    "primary-foreground": "oklch(...)",
    "secondary": "oklch(...)",
    "secondary-foreground": "oklch(...)",
    "muted": "oklch(...)",
    "muted-foreground": "oklch(...)",
    "accent": "oklch(...)",
    "accent-foreground": "oklch(...)",
    "destructive": "oklch(...)",
    "border": "oklch(...)",
    "input": "oklch(...)",
    "ring": "oklch(...)",
    "chart-1": "oklch(...)",
    "chart-2": "oklch(...)",
    "chart-3": "oklch(...)",
    "chart-4": "oklch(...)",
    "chart-5": "oklch(...)",
    "sidebar": "oklch(...)",
    "sidebar-foreground": "oklch(...)",
    "sidebar-primary": "oklch(...)",
    "sidebar-primary-foreground": "oklch(...)",
    "sidebar-accent": "oklch(...)",
    "sidebar-accent-foreground": "oklch(...)",
    "sidebar-border": "oklch(...)",
    "sidebar-ring": "oklch(...)"
  },
  "dark": {
    "background": "oklch(...)",
    "foreground": "oklch(...)",
    "card": "oklch(...)",
    "card-foreground": "oklch(...)",
    "popover": "oklch(...)",
    "popover-foreground": "oklch(...)",
    "primary": "oklch(...)",
    "primary-foreground": "oklch(...)",
    "secondary": "oklch(...)",
    "secondary-foreground": "oklch(...)",
    "muted": "oklch(...)",
    "muted-foreground": "oklch(...)",
    "accent": "oklch(...)",
    "accent-foreground": "oklch(...)",
    "destructive": "oklch(...)",
    "border": "oklch(...)",
    "input": "oklch(...)",
    "ring": "oklch(...)",
    "chart-1": "oklch(...)",
    "chart-2": "oklch(...)",
    "chart-3": "oklch(...)",
    "chart-4": "oklch(...)",
    "chart-5": "oklch(...)",
    "sidebar": "oklch(...)",
    "sidebar-foreground": "oklch(...)",
    "sidebar-primary": "oklch(...)",
    "sidebar-primary-foreground": "oklch(...)",
    "sidebar-accent": "oklch(...)",
    "sidebar-accent-foreground": "oklch(...)",
    "sidebar-border": "oklch(...)",
    "sidebar-ring": "oklch(...)"
  }
}`;

      const response = await generateText({
        model: googleAI('gemini-2.0-flash'),
        system: systemPrompt,
        prompt: `Create a custom theme based on this description: "${description}"`
      });

      // Parse the JSON response
      let themeData;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response.text;
        themeData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("Failed to parse theme JSON:", parseError);
        return {
          success: false,
          theme: null,
          error: "Failed to parse generated theme data"
        };
      }

      return {
        success: true,
        theme: themeData,
      };
    } catch (error) {
      console.error("Error generating theme colors:", error);
      return {
        success: false,
        theme: null,
        error: "Failed to generate theme colors. Please try again."
      };
    }
  },
});

