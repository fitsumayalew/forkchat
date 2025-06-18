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
  
      disabled: false,
  
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

    

  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o-mini",
    provider: "Azure",
    developer: "OpenAI",

    shortDescription: "Faster, less precise GPT-4o",
    fullDescription:
      "Like gpt-4o, but faster. This model sacrifices some of the original GPT-4o's precision for significantly reduced latency. It accepts both text and image inputs.",

    disabled: false,

    limits: { maxInputTokens: 128e3, maxOutputTokens: 16384 },
    features: ["images", "parameters"],
  },
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "Azure",
    developer: "OpenAI",

    shortDescription: "OpenAI's flagship; versatile and intelligent",
    fullDescription:
      "OpenAI's flagship non-reasoning model. Works with text and images. Relatively smart. Good at most things.",

    disabled: true,

    limits: { maxInputTokens: 128e3, maxOutputTokens: 16384 },
    features: ["images", "parameters"],
  },
  "gpt-o3-mini": {
    id: "gpt-o3-mini",
    name: "o3-mini",
    provider: "OpenAI",
    developer: "OpenAI",

    shortDescription: "OpenAI's previous small reasoning model",
    fullDescription:
      "A small, fast, super smart reasoning model. OpenAI clearly didn't want DeepSeek to be getting all the attention. Good at science, math, and coding, even if it's not as good at CSS.",

    disabled: false,

    limits: { maxInputTokens: 2e5, maxOutputTokens: 1e5 },
    features: ["parameters", "reasoning", "reasoningEffort"],
  },
  "gpt-o4-mini": {
    id: "gpt-o4-mini",
    name: "o4-mini",
    provider: "OpenAI",
    developer: "OpenAI",

    shortDescription: "OpenAI's latest small reasoning model",
    fullDescription:
      "A small, fast, even smarter reasoning model. o3-mini was great, this is even better. Good at science, math, and coding, even if it's not as good at CSS.",

    disabled: false,

    limits: { maxInputTokens: 2e5, maxOutputTokens: 1e5 },
    features: ["parameters", "images", "reasoning", "reasoningEffort"],
  },

  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    developer: "Google",

    shortDescription: "Google's latest fast model",
    fullDescription:
      "Google's latest fast model, known for speed and accuracy (and also web search!). Not quite as smart as Claude 3.5 Sonnet, but WAY faster and cheaper. Also has an insanely large context window (it can handle a lot of data).",

    disabled: false,

    limits: { maxInputTokens: 1e6, maxOutputTokens: 65535 },
    streamChunking: "word",
    features: ["images", "pdfs", "search"],

    byok: "optional",
  },

  "gemini-2.0-flash-lite-preview-02-05": {
    id: "gemini-2.0-flash-lite-preview-02-05",
    name: "Gemini 2.0 Flash Lite",
    provider: "Google",
    developer: "Google",

    shortDescription: "Faster, less precise Gemini model",
    fullDescription:
      "Similar to 2.0 Flash, but even faster. Not as smart, but still good at most things.",

    disabled: false,

    limits: { maxInputTokens: 1e6, maxOutputTokens: 8192 },
    streamChunking: "line",
    features: ["fast", "images", "pdfs"],

    byok: "optional",
  },
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    developer: "Google",

    shortDescription: "Google's newest experimental model",
    fullDescription:
      "Google's most advanced model, excelling at complex reasoning and problem-solving. Particularly strong at tackling difficult code challenges, mathematical proofs, and STEM problems. With its massive context window, it can deeply analyze large codebases, datasets and technical documents to provide comprehensive solutions.",

    disabled: false,

    limits: { maxInputTokens: 2e5, maxOutputTokens: 64e3 },
    streamChunking: "word",
    features: [
      "parameters",
      "images",
      "pdfs",
      "search",
      "reasoning",
      "reasoningEffort",
    ],

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

  "llama-4-scout": {
    id: "llama-4-scout",
    name: "Llama 4 Scout",
    provider: "Groq",
    developer: "Meta",

    shortDescription: "Latest OSS model from Meta",
    fullDescription:
      "Llama 4 Scout 17B Instruct (16E) is a mixture-of-experts (MoE) language model developed by Meta, activating 17 billion parameters out of a total of 109B. It supports native multimodal input (text and image) and multilingual output (text and code) across 12 supported languages. Designed for assistant-style interaction and visual reasoning, Scout uses 16 experts per forward pass and features a context length of up to 10 million tokens, with a training corpus of ~40 trillion tokens. Built for high efficiency and local or commercial deployment, Llama 4 Scout incorporates early fusion for seamless modality integration. It is instruction-tuned for use in multilingual chat, captioning, and image understanding tasks. Released under the Llama 4 Community License, it was last trained on data up to August 2024 and launched publicly on April 5, 2025.",

    disabled: false,

    limits: { maxInputTokens: 128e3, maxOutputTokens: 8192 },
    features: ["parameters", "images"],
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
  "grok-v3": {
    name: "Grok 3",
    id: "grok-v3",
    provider: "OpenRouter",
    developer: "xAI",

    shortDescription: "xAI's latest and greatest model",
    fullDescription:
      "xAI's flagship model that excels at data extraction, coding, and text summarization. Possesses deep domain knowledge in finance, healthcare, law, and science.",

    disabled: false,

    limits: { maxInputTokens: 128e3, maxOutputTokens: 8192 },
    features: ["parameters"],
  },
  "grok-v3-mini": {
    name: "Grok 3 Mini",
    id: "grok-v3-mini",
    provider: "OpenRouter",
    developer: "xAI",

    shortDescription: "Faster, less precise version of Grok 3 from xAI",
    fullDescription:
      "A lightweight model that thinks before responding. Great for simple or logic-based tasks that do not require deep domain knowledge.",

    disabled: false,

    limits: { maxInputTokens: 128e3, maxOutputTokens: 8192 },
    features: ["parameters", "reasoning", "reasoningEffort"],
  },
  "gpt-4.1": {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "Azure",
    developer: "OpenAI",

    shortDescription: "OpenAI's Flagship Model",
    fullDescription:
      "GPT-4.1 is a flagship large language model optimized for advanced instruction following, real-world software engineering, and long-context reasoning. It outperforms GPT-4o and GPT-4.5 across coding (54.6% SWE-bench Verified), instruction compliance (87.4% IFEval), and multimodal understanding benchmarks.",

    disabled: false,

    limits: { maxInputTokens: 1e6, maxOutputTokens: 16384 },
    features: ["parameters", "images"],

    streamChunking: "word",
  },
  "gpt-4.1-mini": {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "Azure",
    developer: "OpenAI",

    shortDescription: "Fast and accurate mid-sized model",
    fullDescription:
      "GPT-4.1 Mini is a mid-sized model delivering performance competitive with GPT-4o at substantially lower latency. It has a very large context window and scores 45.1% on hard instruction evals, 35.8% on MultiChallenge, and 84.1% on IFEval. Mini also shows strong coding ability (e.g., 31.6% on Aider's polyglot diff benchmark) and vision understanding.",

    disabled: false,

    limits: { maxInputTokens: 1e6, maxOutputTokens: 16384 },
    features: ["parameters", "images"],

    streamChunking: "word",
  },
  "gpt-4.1-nano": {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "Azure",
    developer: "OpenAI",

    shortDescription: "Fastest model in the GPT-4.1 series",
    fullDescription:
      "For tasks that demand low latency, GPT‑4.1 nano is the fastest model in the GPT-4.1 series. It delivers exceptional performance at a small size with its 1 million token context window, and scores 80.1% on MMLU, 50.3% on GPQA, and 9.8% on Aider polyglot coding – even higher than GPT‑4o mini. It's ideal for tasks like classification or autocompletion.",

    disabled: false,

    limits: { maxInputTokens: 1e6, maxOutputTokens: 16384 },
    features: ["parameters", "images"],

    streamChunking: "word",
  },
  "qwen-2.5-32b": {
    id: "qwen-2.5-32b",
    name: "Qwen 2.5 32b",
    provider: "OpenRouter",
    developer: "Alibaba",

    shortDescription: "Open-weight model from Alibaba",
    fullDescription:
      "The other really good open source model from China. Alibaba's Qwen is very similar to Llama. Good on its own, but strongest when distilled by other data sets or models.",

    disabled: false,

    limits: { maxInputTokens: 128e3, maxOutputTokens: 8e3 },
    features: ["parameters", "fast", "images"],
  },
  "o3-full": {
    id: "o3-full",
    name: "o3",
    provider: "OpenAI",
    developer: "OpenAI",

    shortDescription: "Big reasoning model from OpenAI",
    fullDescription:
      "o3 is a well-rounded and powerful model across domains. It sets a new standard for math, science, coding, and visual reasoning tasks. It also excels at technical writing and instruction-following. Use it to think through multi-step problems that involve analysis across text, code, and images.",
    disabled: true,
    limits: { maxInputTokens: 2e5, maxOutputTokens: 1e5 },
    features: ["images", "parameters", "reasoningEffort", "reasoning"],

    byok: "optional",
  },
  "o3-pro": {
    id: "o3-pro",
    name: "o3 Pro",
    provider: "OpenAI",
    developer: "OpenAI",

    shortDescription: "Largest reasoning model from OpenAI",
    fullDescription:
      "The o3 series of models are trained with reinforcement learning to think before they answer and perform complex reasoning. The o3-pro model uses more compute to think harder and provide consistently better answers.",

    disabled: true,

    limits: { maxInputTokens: 2e5, maxOutputTokens: 1e5 },
    features: ["images", "parameters", "reasoningEffort", "reasoning", "pdfs"],

    byok: "required",
  },

  "claude-3.5": {
    id: "claude-3.5",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    developer: "Anthropic",

    shortDescription: "Anthropic's flagship model",
    fullDescription:
      "Smart model for complex problems. Known for being good at code and math. Also kind of slow and expensive.",

    disabled: true,

    limits: { maxInputTokens: 3e4, maxOutputTokens: 16384 },
    features: ["images", "pdfs", "parameters"],
    statuspage: {
      url: "https://status.anthropic.com",
      apiUrl: "https://status.anthropic.com/api/v2/status.json",
    },

    byok: "optional",
  },
  "claude-3.7": {
    id: "claude-3.7",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    developer: "Anthropic",

    shortDescription: "Anthropic's flagship model",
    fullDescription:
      "The last gen model from Anthropic. Better at code, math, and more. Also kind of slow and expensive.",

    disabled: true,

    limits: { maxInputTokens: 3e4, maxOutputTokens: 16384 },
    features: ["images", "pdfs", "parameters"],
    statuspage: {
      url: "https://status.anthropic.com",
      apiUrl: "https://status.anthropic.com/api/v2/status.json",
    },

    byok: "optional",
  },
  "claude-3.7-reasoning": {
    id: "claude-3.7-reasoning",
    name: "Claude 3.7 Sonnet (Reasoning)",
    provider: "Anthropic",
    developer: "Anthropic",

    shortDescription: "Anthropic's flagship model",
    fullDescription:
      "The last gen model from Anthropic (but you can make it think). Better at code, math, and more. Also kind of slow and expensive.",

    disabled: true,

    limits: { maxInputTokens: 3e4, maxOutputTokens: 16384 },
    features: ["images", "pdfs", "parameters", "reasoning", "reasoningEffort"],
    statuspage: {
      url: "https://status.anthropic.com",
      apiUrl: "https://status.anthropic.com/api/v2/status.json",
    },

    byok: "optional",
  },
  "claude-4-sonnet": {
    id: "claude-4-sonnet",
    name: "Claude 4 Sonnet",
    provider: "Anthropic",
    developer: "Anthropic",

    shortDescription: "Anthropic's flagship model",
    fullDescription:
      "The latest model from Anthropic. Claude Sonnet 4 is a significant upgrade to Claude Sonnet 3.7, delivering superior coding and reasoning while responding more precisely to your instructions.",

    disabled: true,

    limits: { maxInputTokens: 3e4, maxOutputTokens: 16384 },
    features: ["images", "pdfs", "parameters"],
    statuspage: {
      url: "https://status.anthropic.com",
      apiUrl: "https://status.anthropic.com/api/v2/status.json",
    },

    byok: "optional",
  },
  "claude-4-sonnet-reasoning": {
    id: "claude-4-sonnet-reasoning",
    name: "Claude 4 Sonnet (Reasoning)",
    provider: "Anthropic",
    developer: "Anthropic",

    shortDescription: "Anthropic's flagship model",
    fullDescription:
      "The latest model from Anthropic (but you can make it think). Claude Sonnet 4 is a significant upgrade to Claude Sonnet 3.7, delivering superior coding and reasoning while responding more precisely to your instructions.",

    disabled: true,

    limits: { maxInputTokens: 3e4, maxOutputTokens: 16384 },
    features: ["images", "pdfs", "parameters", "reasoning", "reasoningEffort"],
    statuspage: {
      url: "https://status.anthropic.com",
      apiUrl: "https://status.anthropic.com/api/v2/status.json",
    },

    byok: "optional",
  },
  "claude-4-opus": {
    id: "claude-4-opus",
    name: "Claude 4 Opus",
    provider: "Anthropic",
    developer: "Anthropic",

    shortDescription: "Anthropic's flagship model",
    fullDescription:
      "The latest and greatest from Anthropic. Very powerful, but with a cost to match.",

    disabled: true,

    limits: { maxInputTokens: 3e4, maxOutputTokens: 15e3 },
    features: ["images", "pdfs", "parameters", "reasoning"],
    statuspage: {
      url: "https://status.anthropic.com",
      apiUrl: "https://status.anthropic.com/api/v2/status.json",
    },

    byok: "required",
  },
};
