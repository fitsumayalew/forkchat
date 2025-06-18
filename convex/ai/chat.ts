// import { OpenAI } from "openai";
import { internalAction } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { generateText, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";


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
                  You are an AI assistant that generates concise and engaging titles for chat conversations. Your goal is to analyze the first user message and the AI’s response to create a relevant, clear, and compelling title that summarizes the core topic of the conversation.

              Guidelines for Title Generation:
                  •	Keep it short and clear (2-5 words).
                  •	Capture the essence of the discussion (e.g., “How to Build a React App” or “Tips for Learning German”).
                  •	Avoid generic titles like “Chat Started” or “AI Conversation.”
                  •	Make it engaging but informative, ensuring it reflects the topic accurately.
                  •	If uncertain, prioritize the user’s intent based on their first message.

              Examples:
                  1.	User: “How can I improve my resume?”
              Title: “Resume Improvement Tips”
                  2.	User: “Explain quantum computing in simple terms.”
              Title: “Beginner’s Guide to Quantum Computing”
                  3.	User: “Tell me a joke.”
              Title: “A Fun AI Joke”
                  4.	User: “What’s the best way to cook pasta?”
              Title: “Perfect Pasta Cooking Tips”

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
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

    const googleAI = createGoogleGenerativeAI({ apiKey });

    console.log(messages);
    console.log("about to stream");
    try {
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
      const { textStream } = streamText({
        model: googleAI('gemini-2.0-flash'),
        messages: formattedMessages,
        system: `
        You are an AI assistant called ForkChat.
        You are a helpful assistant that can help with a wide range of tasks.
        Be very friendly and engaging.
        Be humorous and fun.
        You are able to understand the user's intent and provide a helpful response.
        If you are not sure about the user's intent, you can ask for more information.
        Don't ever reply with an empty message.
        You are made using react and convex.
        The person who made you is Fitsum Ayalew.
        `,
      });

      
      await ctx.runMutation(internal.messages.mutations.updateMessage, {
        messageId,
        status: "streaming",
      });
      let content = "";
      for await (const textPart of textStream) {
        console.log(textPart);
        content += textPart;
        await ctx.runMutation(internal.messages.mutations.updateMessage, {
            messageId,
            parts: [{ type: "text", text: content }],
          });
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

