export const models = {
  // TO INTEGRATE:
    // Image gen model
    "gpt-image-1": {
      id: "gpt-image-1",
      name: "GPT ImageGen",
      provider: "OpenAI",
      developer: "OpenAI",
  
      shortDescription: "OpenAI's latest and greatest image generation model",
      fullDescription:
        "OpenAI's latest and greatest image generation model, using lots of crazy tech like custom tools for text and reflections. Best image gen available today by a mile.",
  
      disabled: true,
  
      limits: { maxInputTokens: 1e4, maxOutputTokens: 16384 },
      features: ["images", "imageGeneration"],
  
      imageGen: true,
    },

    // thining
    "gemini-2.5-flash-thinking": {
      id: "gemini-2.5-flash-thinking",
      name: "Gemini 2.5 Flash (Thinking)",
      provider: "Google",
      developer: "Google",
  
      shortDescription: "Google's latest fast model",
      fullDescription: "Google's latest fast model, but now it can think!",
  
      disabled: false,
  
      limits: { maxInputTokens: 1e6, maxOutputTokens: 65535 },
      streamChunking: "word",
      features: ["images", "pdfs", "search", "reasoningEffort"],
  
      byok: "optional",
    },
    // IMAGES PDFS AND SEARCH
    "gemini-2.0-flash": {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "Google",
      developer: "Google",
  
      shortDescription: "Google's latest stable model",
      fullDescription:
        "Google's flagship model, known for speed and accuracy (and also web search!). Not quite as smart as Claude 3.5 Sonnet, but WAY faster and cheaper. Also has an insanely large context window (it can handle a lot of data).",
  
      disabled: false,
  
      limits: { maxInputTokens: 1e6, maxOutputTokens: 8192 },
      streamChunking: "word",
      features: ["images", "pdfs", "search"],
  
      byok: "optional",
    },
    "deepseek-r1-distill-qwen-32b": {
      id: "deepseek-r1-distill-qwen-32b",
      name: "DeepSeek R1 (Qwen Distilled)",
      provider: "OpenRouter",
      developer: "DeepSeek",
  
      shortDescription: "DeepSeek R1, distilled on Qwen 32b",
      fullDescription:
        "Similar to the Llama distilled model, but distilled on Qwen 32b instead. Slightly better at code, slightly more likely to fall into thought loops.",
  
      disabled: false,
  
      limits: { maxInputTokens: 16e3, maxOutputTokens: 16384 },
      features: ["parameters", "reasoning"],
    },

    "llama-4-maverick": {
      id: "llama-4-maverick",
      name: "Llama 4 Maverick",
      provider: "OpenRouter",
      developer: "Meta",
  
      shortDescription: "Latest OSS model from Meta",
      fullDescription:
        "Llama 4 Maverick 17B Instruct (128E) is a high-capacity multimodal language model from Meta, built on a mixture-of-experts (MoE) architecture with 128 experts and 17 billion active parameters per forward pass (400B total). It supports multilingual text and image input, and produces multilingual text and code output across 12 supported languages. Optimized for vision-language tasks, Maverick is instruction-tuned for assistant-like behavior, image reasoning, and general-purpose multimodal interaction. Maverick features early fusion for native multimodality and a 1 million token context window. It was trained on a curated mixture of public, licensed, and Meta-platform data, covering ~22 trillion tokens, with a knowledge cutoff in August 2024. Released on April 5, 2025 under the Llama 4 Community License, Maverick is suited for research and commercial applications requiring advanced multimodal understanding and high model throughput.",
  
      disabled: false,
  
      limits: { maxInputTokens: 1e6, maxOutputTokens: 512e3 },
      features: ["parameters", "images"],
    },
};
