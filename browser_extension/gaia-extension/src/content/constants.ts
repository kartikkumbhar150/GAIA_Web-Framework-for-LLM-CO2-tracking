// ==================== TYPE DEFINITIONS ====================

export interface CO2Emissions {
  perRequest: string;
  per1MTokens?: string;
  perImage?: string;
  perMinute?: string;
  rating: 'very-low' | 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high' | 'very-high';
  comparison: string;
}

export interface ModelRecommendation {
  name: string;
  platform: string;
  icon: string;
  description: string;
  bestFor: string[];
  color: string;
  tier: 'flagship' | 'premium' | 'efficient' | 'specialized' | 'value' | 'open-source' | 'enterprise';
  pricing: string;
  contextWindow?: string;
  features?: string[];
  strengths: string[];
  limitations: string[];
  useCase: string;
  co2Emissions?: CO2Emissions;
}

export interface TaskCategory {
  id: string;
  name: string;
  icon: string;
  tasks: string[];
  recommendedModels: {
    llm?: string[];
    image?: string[];
    video?: string[];
    audio?: string[];
  };
}

export interface Platform {
  name: string;
  website: string;
  apiDocs: string;
  logo: string;
  color: string;
  description: string;
}

export interface PlatformFeatures {
  streaming?: boolean;
  batching?: boolean;
  fineTuning?: boolean;
  functionCalling?: boolean;
  vision?: boolean;
  audio?: boolean;
}

export interface RecommendationCriteria {
  taskType: string;
  priority: 'quality' | 'speed' | 'cost' | 'balanced' | 'eco-friendly';
  budget: 'free' | 'low' | 'medium' | 'high';
  expertise: 'beginner' | 'intermediate' | 'expert';
  useCase: 'personal' | 'professional' | 'enterprise';
}

export interface SmartRecommendation {
  primary: ModelRecommendation[];
  alternatives: ModelRecommendation[];
  reasoning: string[];
}

// ==================== LLM MODELS ====================

export const LLM_MODELS: ModelRecommendation[] = [
  // OpenAI Models
  {
    name: "GPT-5.2",
    platform: "OpenAI",
    icon: "🚀",
    description: "OpenAI's flagship model with deep reasoning and 400K context",
    bestFor: ["Complex reasoning", "Long documents", "Research", "Analysis"],
    color: "#10a37f",
    tier: "flagship",
    pricing: "$75/$150 per 1M tokens",
    contextWindow: "400K tokens",
    strengths: ["Coding excellence", "Multi-step reasoning", "Professional work"],
    limitations: ["Higher cost", "Slower responses"],
    useCase: "Best for complex professional tasks requiring deep analysis",
    co2Emissions: {
      perRequest: "15.2g CO₂e",
      per1MTokens: "450g CO₂e",
      rating: "high",
      comparison: "3x average model"
    }
  },
  {
    name: "GPT-4.5 Turbo",
    platform: "OpenAI",
    icon: "⚡",
    description: "Balanced model for general-purpose tasks",
    bestFor: ["General queries", "Fast responses", "Coding", "Writing"],
    color: "#10a37f",
    tier: "premium",
    pricing: "$3/$15 per 1M tokens",
    contextWindow: "128K tokens",
    strengths: ["Speed", "Reliability", "Wide capability"],
    limitations: ["Less reasoning depth than GPT-5"],
    useCase: "Everyday tasks and rapid prototyping",
    co2Emissions: {
      perRequest: "4.7g CO₂e",
      per1MTokens: "140g CO₂e",
      rating: "medium",
      comparison: "~1x average model"
    }
  },
  {
    name: "o3-mini",
    platform: "OpenAI",
    icon: "🧮",
    description: "Reasoning model optimized for STEM tasks",
    bestFor: ["Math", "Science", "Logic problems", "Code debugging"],
    color: "#10a37f",
    tier: "specialized",
    pricing: "$1.1/$4.4 per 1M tokens",
    contextWindow: "200K tokens",
    strengths: ["Mathematical reasoning", "Scientific analysis"],
    limitations: ["Slower generation", "Specialized use"],
    useCase: "STEM education and technical problem-solving",
    co2Emissions: {
      perRequest: "8.3g CO₂e",
      per1MTokens: "250g CO₂e",
      rating: "medium-high",
      comparison: "1.7x average model"
    }
  },

  // Anthropic Claude Models
  {
    name: "Claude Opus 4.5",
    platform: "Anthropic",
    icon: "🎯",
    description: "Most powerful Claude for complex reasoning and long tasks",
    bestFor: ["Deep analysis", "Long documents", "Agent tasks", "Research"],
    color: "#d97757",
    tier: "flagship",
    pricing: "Contact for pricing",
    contextWindow: "200K tokens (1M beta)",
    strengths: ["Multi-step reasoning", "Agent capabilities", "Safety"],
    limitations: ["Limited availability", "Higher cost"],
    useCase: "Enterprise applications requiring highest capability",
    co2Emissions: {
      perRequest: "12.8g CO₂e",
      per1MTokens: "380g CO₂e",
      rating: "high",
      comparison: "2.5x average model"
    }
  },
  {
    name: "Claude Sonnet 4.5",
    platform: "Anthropic",
    icon: "🧠",
    description: "Smart, efficient model for everyday professional use",
    bestFor: ["Coding", "Writing", "Analysis", "B2B workflows"],
    color: "#d97757",
    tier: "premium",
    pricing: "$3/$15 per 1M tokens",
    contextWindow: "200K tokens",
    strengths: ["Coding (77.2% SWE-bench)", "Speed", "Reliability"],
    limitations: ["Less powerful than Opus"],
    useCase: "Professional daily work and coding tasks",
    co2Emissions: {
      perRequest: "3.2g CO₂e",
      per1MTokens: "95g CO₂e",
      rating: "low",
      comparison: "0.6x average model"
    }
  },
  {
    name: "Claude Haiku 4.5",
    platform: "Anthropic",
    icon: "⚡",
    description: "Fast, lightweight model for quick tasks",
    bestFor: ["Quick queries", "Simple tasks", "High volume", "Chat"],
    color: "#d97757",
    tier: "efficient",
    pricing: "$0.25/$1.25 per 1M tokens",
    contextWindow: "200K tokens",
    strengths: ["Speed", "Cost efficiency", "Reliability"],
    limitations: ["Less capable than Sonnet/Opus"],
    useCase: "High-volume simple tasks and chatbots",
    co2Emissions: {
      perRequest: "0.8g CO₂e",
      per1MTokens: "25g CO₂e",
      rating: "very-low",
      comparison: "0.15x average model"
    }
  },

  // Google Gemini Models
  {
    name: "Gemini 3 Pro",
    platform: "Google",
    icon: "💎",
    description: "Leading reasoning model with 1501 Elo score",
    bestFor: ["Abstract reasoning", "Multimodal", "Research", "Analysis"],
    color: "#4285f4",
    tier: "flagship",
    pricing: "Contact for pricing",
    contextWindow: "2M tokens",
    strengths: ["ARC-AGI-2 (45.1%)", "Massive context", "Multimodal"],
    limitations: ["API access limited"],
    useCase: "Advanced research and complex multimodal tasks",
    co2Emissions: {
      perRequest: "18.5g CO₂e",
      per1MTokens: "550g CO₂e",
      rating: "very-high",
      comparison: "3.6x average model"
    }
  },
  {
    name: "Gemini 2.5 Flash",
    platform: "Google",
    icon: "⚡",
    description: "Fast, efficient model for production use",
    bestFor: ["Speed", "Cost efficiency", "High throughput", "APIs"],
    color: "#4285f4",
    tier: "efficient",
    pricing: "$0.075/$0.30 per 1M tokens",
    contextWindow: "1M tokens",
    strengths: ["Ultra-fast", "Cost-effective", "Stable"],
    limitations: ["Less capability than Pro"],
    useCase: "Production APIs and high-volume processing",
    co2Emissions: {
      perRequest: "1.2g CO₂e",
      per1MTokens: "35g CO₂e",
      rating: "very-low",
      comparison: "0.23x average model"
    }
  },

  // DeepSeek Models
  {
    name: "DeepSeek V3.2",
    platform: "DeepSeek",
    icon: "🔬",
    description: "Ultra-affordable frontier model from China",
    bestFor: ["Budget projects", "Research", "Math", "Science"],
    color: "#0ea5e9",
    tier: "value",
    pricing: "$0.28/$0.42 per 1M tokens",
    contextWindow: "128K tokens",
    strengths: ["90% cheaper than GPT-5", "Strong reasoning", "Open weights"],
    limitations: ["Smaller context window"],
    useCase: "Cost-effective development and experimentation",
    co2Emissions: {
      perRequest: "2.1g CO₂e",
      per1MTokens: "65g CO₂e",
      rating: "low",
      comparison: "0.4x average model"
    }
  },
  {
    name: "DeepSeek R1",
    platform: "DeepSeek",
    icon: "🧮",
    description: "Reasoning-focused model for scientific tasks",
    bestFor: ["Scientific reasoning", "Mathematical proofs", "Logic"],
    color: "#0ea5e9",
    tier: "specialized",
    pricing: "$0.55/$2.19 per 1M tokens",
    contextWindow: "128K tokens",
    strengths: ["Cost-effective reasoning", "Transparent AI"],
    limitations: ["Specialized use case"],
    useCase: "Academic research and technical analysis",
    co2Emissions: {
      perRequest: "5.4g CO₂e",
      per1MTokens: "160g CO₂e",
      rating: "medium",
      comparison: "1.1x average model"
    }
  },

  // Meta Llama Models
  {
    name: "Llama 4 405B",
    platform: "Meta",
    icon: "🦙",
    description: "Open-source flagship model for on-premise deployment",
    bestFor: ["On-premise", "Customization", "Privacy", "Research"],
    color: "#0668e1",
    tier: "open-source",
    pricing: "Free (compute costs apply)",
    contextWindow: "128K tokens",
    strengths: ["Open weights", "Multimodal", "Customizable"],
    limitations: ["Requires infrastructure"],
    useCase: "Enterprise on-premise and custom deployments",
    co2Emissions: {
      perRequest: "Variable",
      per1MTokens: "120-400g CO₂e",
      rating: "medium",
      comparison: "Depends on infrastructure (renewable energy = 0.8x, coal = 2.6x)"
    }
  },
  {
    name: "Llama 4 70B",
    platform: "Meta",
    icon: "🦙",
    description: "Efficient open model for local deployment",
    bestFor: ["Local deployment", "Privacy", "Fine-tuning"],
    color: "#0668e1",
    tier: "open-source",
    pricing: "Free (compute costs apply)",
    contextWindow: "128K tokens",
    strengths: ["Runs locally", "Customizable", "Privacy"],
    limitations: ["Lower capability than 405B"],
    useCase: "Local AI applications and privacy-focused projects",
    co2Emissions: {
      perRequest: "Variable",
      per1MTokens: "40-180g CO₂e",
      rating: "low-medium",
      comparison: "Depends on infrastructure (renewable = 0.3x, coal = 1.2x)"
    }
  },

  // Perplexity Models
  {
    name: "Perplexity R1",
    platform: "Perplexity",
    icon: "🔍",
    description: "Uncensored reasoning model for research",
    bestFor: ["Research", "Analysis", "Unbiased info", "Technical work"],
    color: "#20808d",
    tier: "specialized",
    pricing: "Contact for pricing",
    contextWindow: "128K tokens",
    strengths: ["Unbiased", "US-hosted", "Research-focused"],
    limitations: ["Less content filtering"],
    useCase: "Academic and enterprise research workflows",
    co2Emissions: {
      perRequest: "6.8g CO₂e",
      per1MTokens: "205g CO₂e",
      rating: "medium",
      comparison: "1.4x average model"
    }
  },

  // Alibaba Qwen Models
  {
    name: "Qwen3-Max",
    platform: "Alibaba",
    icon: "🌟",
    description: "1T parameter MoE model with multilingual support",
    bestFor: ["Multilingual", "Large scale", "Research"],
    color: "#ff6a00",
    tier: "flagship",
    pricing: "Contact for pricing",
    contextWindow: "128K tokens",
    strengths: ["119 languages", "AIME25 (92.3%)", "Massive scale"],
    limitations: ["Less available globally"],
    useCase: "Multilingual applications and large-scale projects",
    co2Emissions: {
      perRequest: "22.5g CO₂e",
      per1MTokens: "680g CO₂e",
      rating: "very-high",
      comparison: "4.5x average model"
    }
  },

  // Mistral Models
  {
    name: "Mistral Large 2",
    platform: "Mistral AI",
    icon: "🌬️",
    description: "European flagship model with strong performance",
    bestFor: ["European deployment", "Coding", "Reasoning"],
    color: "#f7931a",
    tier: "premium",
    pricing: "$3/$9 per 1M tokens",
    contextWindow: "128K tokens",
    strengths: ["GDPR compliant", "Strong coding", "Low latency"],
    limitations: ["Smaller ecosystem"],
    useCase: "European enterprises and privacy-focused applications",
    co2Emissions: {
      perRequest: "4.2g CO₂e",
      per1MTokens: "125g CO₂e",
      rating: "low-medium",
      comparison: "0.8x average model"
    }
  },

  // xAI Grok Models
  {
    name: "Grok 4.1",
    platform: "xAI",
    icon: "🤖",
    description: "Real-time model with X platform integration",
    bestFor: ["Real-time news", "Trend analysis", "Social insights"],
    color: "#1da1f2",
    tier: "specialized",
    pricing: "Contact for pricing",
    contextWindow: "128K tokens",
    strengths: ["Real-time data", "X integration", "Current events"],
    limitations: ["Limited availability"],
    useCase: "Social media analysis and real-time insights",
    co2Emissions: {
      perRequest: "7.5g CO₂e",
      per1MTokens: "225g CO₂e",
      rating: "medium-high",
      comparison: "1.5x average model"
    }
  },

  // Cohere Models
  {
    name: "Command R+",
    platform: "Cohere",
    icon: "🎪",
    description: "Enterprise model with strong RAG capabilities",
    bestFor: ["RAG", "Enterprise search", "Document analysis"],
    color: "#d18ee2",
    tier: "premium",
    pricing: "$3/$15 per 1M tokens",
    contextWindow: "128K tokens",
    strengths: ["RAG optimization", "Enterprise tools", "Multilingual"],
    limitations: ["Specialized for enterprise"],
    useCase: "Enterprise search and retrieval systems",
    co2Emissions: {
      perRequest: "3.8g CO₂e",
      per1MTokens: "115g CO₂e",
      rating: "low-medium",
      comparison: "0.75x average model"
    }
  }
];

// ==================== IMAGE GENERATION MODELS ====================

export const IMAGE_MODELS: ModelRecommendation[] = [
  {
    name: "FLUX.1.1 Pro",
    platform: "Black Forest Labs",
    icon: "🎨",
    description: "Leading photorealistic model with 4.5s generation",
    bestFor: ["Photorealism", "Commercial use", "Quality", "Speed"],
    color: "#8b5cf6",
    tier: "flagship",
    pricing: "$0.04 per image",
    features: ["4K resolution", "4.5s generation", "Licensed training"],
    strengths: ["Highest quality", "Fast", "Commercial safe"],
    limitations: ["Cost per image"],
    useCase: "Professional photography and commercial projects",
    co2Emissions: {
      perRequest: "12.5g CO₂e",
      perImage: "12.5g CO₂e",
      rating: "medium-high",
      comparison: "1.8x average image model"
    }
  },
  {
    name: "FLUX.1 Schnell",
    platform: "Black Forest Labs",
    icon: "⚡",
    description: "Ultra-fast variant optimized for speed",
    bestFor: ["Rapid iteration", "Prototyping", "High volume"],
    color: "#8b5cf6",
    tier: "efficient",
    pricing: "$0.003 per image",
    features: ["1-2s generation", "1024x1024", "Commercial use"],
    strengths: ["Fastest generation", "Cost-effective"],
    limitations: ["Slightly lower quality"],
    useCase: "Rapid prototyping and high-volume generation",
    co2Emissions: {
      perRequest: "2.8g CO₂e",
      perImage: "2.8g CO₂e",
      rating: "low",
      comparison: "0.4x average image model"
    }
  },
  {
    name: "Midjourney v7",
    platform: "Midjourney",
    icon: "🖼️",
    description: "Artistic king with unmatched aesthetic quality",
    bestFor: ["Art", "Concept design", "Creative work", "Aesthetics"],
    color: "#ff6b6b",
    tier: "flagship",
    pricing: "$10-120/month",
    features: ["Style reference", "Web interface", "Stealth mode"],
    strengths: ["Best aesthetics", "Artistic quality", "Community"],
    limitations: ["No API", "Subscription only"],
    useCase: "Concept art, creative projects, and inspiration",
    co2Emissions: {
      perRequest: "8.2g CO₂e",
      perImage: "8.2g CO₂e",
      rating: "medium",
      comparison: "1.2x average image model"
    }
  },
  {
    name: "DALL-E 3 HD",
    platform: "OpenAI",
    icon: "🤖",
    description: "Best prompt accuracy and text rendering",
    bestFor: ["Prompt accuracy", "Text in images", "Product viz"],
    color: "#10a37f",
    tier: "premium",
    pricing: "$0.040-$0.120 per image",
    features: ["ChatGPT integration", "Text accuracy", "1024x1792"],
    strengths: ["Prompt adherence", "Text rendering", "Ease of use"],
    limitations: ["Less artistic than Midjourney"],
    useCase: "Marketing materials and precise visualizations",
    co2Emissions: {
      perRequest: "9.8g CO₂e",
      perImage: "9.8g CO₂e",
      rating: "medium",
      comparison: "1.4x average image model"
    }
  },
  {
    name: "Stable Diffusion 3.5",
    platform: "Stability AI",
    icon: "🔧",
    description: "Open-source with maximum customization",
    bestFor: ["Customization", "Local deployment", "Fine-tuning"],
    color: "#ec4899",
    tier: "open-source",
    pricing: "Free (compute costs)",
    features: ["Open weights", "LoRA support", "ComfyUI"],
    strengths: ["Free", "Customizable", "Privacy"],
    limitations: ["Technical setup", "Variable quality"],
    useCase: "Custom workflows and specialized styles",
    co2Emissions: {
      perRequest: "Variable",
      perImage: "3-15g CO₂e",
      rating: "low-medium",
      comparison: "Depends on hardware (GPU efficiency varies 0.4-2.1x)"
    }
  },
  {
    name: "Adobe Firefly Image 3",
    platform: "Adobe",
    icon: "🎯",
    description: "Enterprise-safe with Creative Cloud integration",
    bestFor: ["Commercial use", "Adobe workflow", "Brand safety"],
    color: "#ff0000",
    tier: "enterprise",
    pricing: "Included with Adobe CC",
    features: ["Licensed data", "Adobe integration", "Vector support"],
    strengths: ["Legal safety", "Workflow integration"],
    limitations: ["Requires Adobe subscription"],
    useCase: "Professional design and commercial projects",
    co2Emissions: {
      perRequest: "7.5g CO₂e",
      perImage: "7.5g CO₂e",
      rating: "medium",
      comparison: "1.1x average image model"
    }
  },
  {
    name: "Ideogram 2.0",
    platform: "Ideogram",
    icon: "📝",
    description: "Best text-in-image generation for logos",
    bestFor: ["Text rendering", "Logos", "Typography", "Marketing"],
    color: "#f59e0b",
    tier: "specialized",
    pricing: "$7-16/month",
    features: ["Perfect text", "Logo design", "Multiple styles"],
    strengths: ["Text accuracy", "Logo creation"],
    limitations: ["Newer platform"],
    useCase: "Logo design and text-heavy graphics",
    co2Emissions: {
      perRequest: "5.2g CO₂e",
      perImage: "5.2g CO₂e",
      rating: "low-medium",
      comparison: "0.75x average image model"
    }
  },
  {
    name: "Leonardo.ai",
    platform: "Leonardo.ai",
    icon: "🎮",
    description: "Best for game assets and character consistency",
    bestFor: ["Game dev", "Characters", "Consistency", "Assets"],
    color: "#7c3aed",
    tier: "specialized",
    pricing: "Free tier + $12-60/month",
    features: ["150 daily free", "Character consistency", "Asset packs"],
    strengths: ["Character consistency", "Game assets"],
    limitations: ["Focused on gaming"],
    useCase: "Game development and character creation",
    co2Emissions: {
      perRequest: "6.8g CO₂e",
      perImage: "6.8g CO₂e",
      rating: "medium",
      comparison: "1.0x average image model"
    }
  },
  {
    name: "Imagen 3",
    platform: "Google",
    icon: "🌈",
    description: "Google's multimodal image generator",
    bestFor: ["Integration", "Enterprise", "Multimodal"],
    color: "#4285f4",
    tier: "enterprise",
    pricing: "Contact for pricing",
    features: ["GCP integration", "Enterprise scale", "Safety"],
    strengths: ["Enterprise features", "Google ecosystem"],
    limitations: ["Limited public access"],
    useCase: "Enterprise applications in Google Cloud",
    co2Emissions: {
      perRequest: "10.2g CO₂e",
      perImage: "10.2g CO₂e",
      rating: "medium-high",
      comparison: "1.5x average image model"
    }
  },
  {
    name: "Playground AI",
    platform: "Playground AI",
    icon: "🎪",
    description: "Free tier champion with 500 daily images",
    bestFor: ["Learning", "Experimentation", "Volume"],
    color: "#f97316",
    tier: "value",
    pricing: "500 free daily",
    features: ["Free tier", "Multiple models", "Easy interface"],
    strengths: ["Generous free tier", "Multiple models"],
    limitations: ["Free images are public"],
    useCase: "Learning and high-volume testing",
    co2Emissions: {
      perRequest: "4.5g CO₂e",
      perImage: "4.5g CO₂e",
      rating: "low-medium",
      comparison: "0.65x average image model"
    }
  }
];

// ==================== VIDEO GENERATION MODELS ====================

export const VIDEO_MODELS: ModelRecommendation[] = [
  {
    name: "Sora 2",
    platform: "OpenAI",
    icon: "🎬",
    description: "Cinematic quality with native audio and physics",
    bestFor: ["Cinematic", "Realism", "Physics", "Long videos"],
    color: "#10a37f",
    tier: "flagship",
    pricing: "$200+/month estimated",
    features: ["Up to 60s", "1080p", "Native audio", "C2PA watermarks"],
    strengths: ["Best physics", "Synchronized audio", "Photorealism"],
    limitations: ["Limited access", "High cost", "US/Canada only"],
    useCase: "High-end video production and commercials",
    co2Emissions: {
      perRequest: "285g CO₂e",
      perMinute: "475g CO₂e",
      rating: "very-high",
      comparison: "4.2x average video model"
    }
  },
  {
    name: "Runway Gen-4.5",
    platform: "Runway",
    icon: "🎥",
    description: "Professional toolkit with frame-level control",
    bestFor: ["Professional editing", "Control", "4K output"],
    color: "#8b5cf6",
    tier: "premium",
    pricing: "$12-95/month",
    features: ["4K resolution", "Motion brush", "Camera controls"],
    strengths: ["Precision control", "4K output", "Professional tools"],
    limitations: ["Shorter duration", "Learning curve"],
    useCase: "Professional video production and editing",
    co2Emissions: {
      perRequest: "195g CO₂e",
      perMinute: "390g CO₂e",
      rating: "high",
      comparison: "2.9x average video model"
    }
  },
  {
    name: "Google Veo 3.1",
    platform: "Google",
    icon: "🌟",
    description: "4K HDR with YouTube Shorts integration",
    bestFor: ["Quality", "YouTube", "Enterprise"],
    color: "#4285f4",
    tier: "flagship",
    pricing: "Contact for pricing",
    features: ["4K HDR", "Native audio", "SynthID watermark"],
    strengths: ["Highest resolution", "Google integration"],
    limitations: ["Limited access"],
    useCase: "YouTube content and enterprise video",
    co2Emissions: {
      perRequest: "325g CO₂e",
      perMinute: "650g CO₂e",
      rating: "very-high",
      comparison: "4.8x average video model"
    }
  },
  {
    name: "Pika 2.5",
    platform: "Pika Labs",
    icon: "⚡",
    description: "Fast, creative effects with beginner-friendly UI",
    bestFor: ["Social media", "Quick edits", "Effects"],
    color: "#ec4899",
    tier: "efficient",
    pricing: "$8-70/month",
    features: ["Pikaffects", "Fast generation", "Easy interface"],
    strengths: ["Speed", "Effects", "Beginner-friendly"],
    limitations: ["720p default", "Less photorealistic"],
    useCase: "Social media content and rapid iteration",
    co2Emissions: {
      perRequest: "45g CO₂e",
      perMinute: "90g CO₂e",
      rating: "low",
      comparison: "0.65x average video model"
    }
  },
  {
    name: "Kling AI 2.6",
    platform: "Kuaishou",
    icon: "🎭",
    description: "2-minute videos with simultaneous audio generation",
    bestFor: ["Long videos", "Lip sync", "Audio integration"],
    color: "#f59e0b",
    tier: "value",
    pricing: "$12-60/month",
    features: ["Up to 2 min", "1080p", "Native audio", "Free tier"],
    strengths: ["Longest videos", "Audio sync", "Affordable"],
    limitations: ["Chinese company", "Less polished"],
    useCase: "Long-form content and budget projects",
    co2Emissions: {
      perRequest: "165g CO₂e",
      perMinute: "140g CO₂e",
      rating: "medium",
      comparison: "1.0x average video model"
    }
  },
  {
    name: "Luma Ray3",
    platform: "Luma Labs",
    icon: "💫",
    description: "Superior physics simulation with 4K HDR",
    bestFor: ["Physics realism", "Quality", "Natural motion"],
    color: "#06b6d4",
    tier: "premium",
    pricing: "$7.99-30/month",
    features: ["4K HDR", "Physics engine", "Natural motion"],
    strengths: ["Realistic physics", "Quality", "Affordable"],
    limitations: ["Shorter clips"],
    useCase: "Realistic animations and product demos",
    co2Emissions: {
      perRequest: "125g CO₂e",
      perMinute: "250g CO₂e",
      rating: "medium",
      comparison: "1.8x average video model"
    }
  },
  {
    name: "Hailuo AI 2.3",
    platform: "MiniMax",
    icon: "🌊",
    description: "Chinese model with competitive pricing",
    bestFor: ["Budget", "Asian markets", "Experimentation"],
    color: "#14b8a6",
    tier: "value",
    pricing: "$10-50/month",
    features: ["25-30 fps", "1080p", "Free tier"],
    strengths: ["Affordable", "Decent quality"],
    limitations: ["Less known", "Variable results"],
    useCase: "Budget projects and Asian market content",
    co2Emissions: {
      perRequest: "85g CO₂e",
      perMinute: "170g CO₂e",
      rating: "low-medium",
      comparison: "1.2x average video model"
    }
  },
  {
    name: "Adobe Firefly Video",
    platform: "Adobe",
    icon: "🎯",
    description: "Creative Cloud integration with multi-model access",
    bestFor: ["Adobe workflow", "Multiple models", "Professional"],
    color: "#ff0000",
    tier: "enterprise",
    pricing: "Included with Adobe CC",
    features: ["4K", "Adobe integration", "Multiple model access"],
    strengths: ["Workflow integration", "Multiple models"],
    limitations: ["Requires Adobe subscription"],
    useCase: "Professional Adobe-based video workflows",
    co2Emissions: {
      perRequest: "155g CO₂e",
      perMinute: "310g CO₂e",
      rating: "medium-high",
      comparison: "2.3x average video model"
    }
  },
  {
    name: "Stable Video Diffusion",
    platform: "Stability AI",
    icon: "🔧",
    description: "Open-source video generation for customization",
    bestFor: ["Customization", "Research", "Local deployment"],
    color: "#ec4899",
    tier: "open-source",
    pricing: "Free (compute costs)",
    features: ["Open weights", "Customizable", "Research"],
    strengths: ["Free", "Customizable", "Privacy"],
    limitations: ["Technical setup", "Variable quality"],
    useCase: "Research and custom video pipelines",
    co2Emissions: {
      perRequest: "Variable",
      perMinute: "60-280g CO₂e",
      rating: "low-medium",
      comparison: "Depends on hardware (0.4-2.1x based on GPU efficiency)"
    }
  },
  {
    name: "Wan 2.2",
    platform: "ByteDance",
    icon: "🎪",
    description: "Open-source alternative with good quality",
    bestFor: ["Open-source", "Customization", "Privacy"],
    color: "#a855f7",
    tier: "open-source",
    pricing: "Free (compute costs)",
    features: ["16 fps default", "Customizable", "RIFE support"],
    strengths: ["Free", "Open", "Flexible"],
    limitations: ["Lower fps", "Technical"],
    useCase: "Custom video generation pipelines",
    co2Emissions: {
      perRequest: "Variable",
      perMinute: "50-240g CO₂e",
      rating: "low-medium",
      comparison: "Depends on infrastructure (0.35-1.8x)"
    }
  }
];

// ==================== AUDIO/SPEECH MODELS ====================

export const AUDIO_MODELS: ModelRecommendation[] = [
  {
    name: "ElevenLabs Multilingual v2",
    platform: "ElevenLabs",
    icon: "🎙️",
    description: "Most realistic TTS with emotional control",
    bestFor: ["Quality", "Emotion", "Voice cloning", "Multilingual"],
    color: "#7c3aed",
    tier: "flagship",
    pricing: "$5-99/month",
    features: ["32 languages", "Voice cloning", "Emotion control"],
    strengths: ["Best quality", "Emotional range", "Natural voices"],
    limitations: ["Cost at scale"],
    useCase: "Professional voiceovers and audiobooks",
    co2Emissions: {
      perRequest: "3.2g CO₂e",
      perMinute: "19.2g CO₂e",
      rating: "medium",
      comparison: "1.3x average audio model"
    }
  },
  {
    name: "ElevenLabs Flash v2.5",
    platform: "ElevenLabs",
    icon: "⚡",
    description: "Ultra-low latency for real-time applications",
    bestFor: ["Real-time", "Low latency", "AI agents"],
    color: "#7c3aed",
    tier: "specialized",
    pricing: "$5-99/month",
    features: ["75ms latency", "Real-time", "AI agents"],
    strengths: ["Ultra-fast", "Natural", "Reliable"],
    limitations: ["Slightly less expressive"],
    useCase: "AI voice agents and real-time applications",
    co2Emissions: {
      perRequest: "0.9g CO₂e",
      perMinute: "5.4g CO₂e",
      rating: "low",
      comparison: "0.35x average audio model"
    }
  },
  {
    name: "PlayHT 3.0",
    platform: "Play.ht",
    icon: "🎭",
    description: "800+ voices in 130+ languages",
    bestFor: ["Voice variety", "Languages", "Enterprise"],
    color: "#f59e0b",
    tier: "premium",
    pricing: "$19-99/month",
    features: ["800+ voices", "130+ languages", "SSML control"],
    strengths: ["Most voices", "Language support", "Breathing effects"],
    limitations: ["Interface complexity"],
    useCase: "Multilingual content and voice variety",
    co2Emissions: {
      perRequest: "2.8g CO₂e",
      perMinute: "16.8g CO₂e",
      rating: "medium",
      comparison: "1.1x average audio model"
    }
  },
  {
    name: "Deepgram Aura",
    platform: "Deepgram",
    icon: "🌊",
    description: "Fastest TTS with <200ms latency",
    bestFor: ["Speed", "IVR", "Real-time AI"],
    color: "#06b6d4",
    tier: "specialized",
    pricing: "Pay-as-you-go",
    features: ["<200ms latency", "Real-time", "API-first"],
    strengths: ["Fastest available", "Low latency", "Scalable"],
    limitations: ["Less emotional range"],
    useCase: "IVR systems and conversational AI",
    co2Emissions: {
      perRequest: "0.6g CO₂e",
      perMinute: "3.6g CO₂e",
      rating: "very-low",
      comparison: "0.24x average audio model"
    }
  },
  {
    name: "OpenAI TTS",
    platform: "OpenAI",
    icon: "🤖",
    description: "Integrated TTS with ChatGPT ecosystem",
    bestFor: ["Integration", "Simplicity", "OpenAI ecosystem"],
    color: "#10a37f",
    tier: "premium",
    pricing: "$15 per 1M characters",
    features: ["6 voices", "HD quality", "API access"],
    strengths: ["Easy integration", "Quality", "Reliable"],
    limitations: ["Limited voices"],
    useCase: "OpenAI-integrated applications",
    co2Emissions: {
      perRequest: "2.1g CO₂e",
      perMinute: "12.6g CO₂e",
      rating: "low-medium",
      comparison: "0.85x average audio model"
    }
  },
  {
    name: "Lovo AI",
    platform: "Lovo",
    icon: "🎬",
    description: "500+ voices with emotional expression",
    bestFor: ["Content creation", "Video", "Gaming"],
    color: "#ec4899",
    tier: "premium",
    pricing: "$29-199/month",
    features: ["500+ voices", "100 languages", "Emotion control"],
    strengths: ["Emotional range", "Video focus"],
    limitations: ["Mid-tier quality"],
    useCase: "YouTube content and video narration",
    co2Emissions: {
      perRequest: "2.5g CO₂e",
      perMinute: "15.0g CO₂e",
      rating: "medium",
      comparison: "1.0x average audio model"
    }
  },
  {
    name: "WellSaid Labs",
    platform: "WellSaid",
    icon: "🏢",
    description: "Enterprise-grade TTS for business",
    bestFor: ["Enterprise", "Control", "Quality"],
    color: "#0ea5e9",
    tier: "enterprise",
    pricing: "Enterprise pricing",
    features: ["Fine control", "Tone adjustment", "Team features"],
    strengths: ["Professional quality", "Control", "Reliability"],
    limitations: ["Enterprise-only"],
    useCase: "Enterprise training and corporate content",
    co2Emissions: {
      perRequest: "3.5g CO₂e",
      perMinute: "21.0g CO₂e",
      rating: "medium-high",
      comparison: "1.4x average audio model"
    }
  },
  {
    name: "Hume AI Octave",
    platform: "Hume AI",
    icon: "🎵",
    description: "First TTS that understands meaning",
    bestFor: ["Emotion", "Context", "Natural speech"],
    color: "#a855f7",
    tier: "flagship",
    pricing: "Contact for pricing",
    features: ["Contextual understanding", "5s voice cloning"],
    strengths: ["Most natural", "Context-aware", "Emotional"],
    limitations: ["Newer platform"],
    useCase: "High-end conversational AI and agents",
    co2Emissions: {
      perRequest: "4.2g CO₂e",
      perMinute: "25.2g CO₂e",
      rating: "high",
      comparison: "1.7x average audio model"
    }
  },
  {
    name: "Murf AI",
    platform: "Murf",
    icon: "🎙️",
    description: "120+ voices for content creators",
    bestFor: ["Content creation", "Presentations", "Marketing"],
    color: "#f97316",
    tier: "premium",
    pricing: "$19-99/month",
    features: ["120+ voices", "20+ languages", "Video sync"],
    strengths: ["User-friendly", "Good variety"],
    limitations: ["Mid-tier quality"],
    useCase: "Marketing and educational content",
    co2Emissions: {
      perRequest: "2.2g CO₂e",
      perMinute: "13.2g CO₂e",
      rating: "low-medium",
      comparison: "0.9x average audio model"
    }
  },
  {
    name: "Listnr",
    platform: "Listnr",
    icon: "🌍",
    description: "1000+ voices in 142 languages",
    bestFor: ["Languages", "Global content", "Podcasts"],
    color: "#14b8a6",
    tier: "premium",
    pricing: "$19-99/month",
    features: ["1000+ voices", "142 languages", "Podcast tools"],
    strengths: ["Most languages", "Podcast features"],
    limitations: ["Variable quality"],
    useCase: "Global content and podcast creation",
    co2Emissions: {
      perRequest: "2.6g CO₂e",
      perMinute: "15.6g CO₂e",
      rating: "medium",
      comparison: "1.05x average audio model"
    }
  }
];

// ==================== TASK CATEGORIES ====================

export const TASK_CATEGORIES: TaskCategory[] = [
  {
    id: "writing",
    name: "Writing & Content",
    icon: "✍️",
    tasks: [
      "Blog post",
      "Email draft",
      "Social media",
      "Product copy",
      "Essay",
      "Article",
      "Script",
      "Newsletter"
    ],
    recommendedModels: {
      llm: ["Claude Sonnet 4.5", "GPT-4.5 Turbo", "Gemini 2.5 Flash"]
    }
  },
  {
    id: "coding",
    name: "Coding & Development",
    icon: "💻",
    tasks: [
      "Debug code",
      "Write function",
      "Code review",
      "API design",
      "Database query",
      "Test writing",
      "Refactoring",
      "Documentation"
    ],
    recommendedModels: {
      llm: ["Claude Sonnet 4.5", "GPT-5.2", "DeepSeek V3.2"]
    }
  },
  {
    id: "research",
    name: "Research & Analysis",
    icon: "📊",
    tasks: [
      "Data analysis",
      "Market research",
      "Competitive analysis",
      "Literature review",
      "Trend analysis",
      "Report writing",
      "Summarization"
    ],
    recommendedModels: {
      llm: ["Gemini 3 Pro", "GPT-5.2", "Claude Opus 4.5", "Perplexity R1"]
    }
  },
  {
    id: "creative",
    name: "Creative & Design",
    icon: "🎨",
    tasks: [
      "Brainstorming",
      "Story writing",
      "Character design",
      "World building",
      "Marketing copy",
      "Video script",
      "Poetry",
      "Songwriting"
    ],
    recommendedModels: {
      llm: ["GPT-4.5 Turbo", "Claude Sonnet 4.5"],
      image: ["Midjourney v7", "DALL-E 3 HD", "Leonardo.ai"]
    }
  },
  {
    id: "visual",
    name: "Visual Content",
    icon: "🖼️",
    tasks: [
      "Concept art",
      "Product photos",
      "Marketing visuals",
      "Social media images",
      "Logo design",
      "Character art",
      "Illustrations",
      "Thumbnails"
    ],
    recommendedModels: {
      image: ["Midjourney v7", "FLUX.1.1 Pro", "DALL-E 3 HD", "Ideogram 2.0"]
    }
  },
  {
    id: "video",
    name: "Video Production",
    icon: "🎬",
    tasks: [
      "Video ads",
      "Social clips",
      "Product demos",
      "Explainer videos",
      "B-roll footage",
      "Animations",
      "Short films",
      "Tutorials"
    ],
    recommendedModels: {
      video: ["Sora 2", "Runway Gen-4.5", "Pika 2.5", "Kling AI 2.6"]
    }
  },
  {
    id: "audio",
    name: "Audio & Voice",
    icon: "🎙️",
    tasks: [
      "Voiceover",
      "Podcast narration",
      "Audiobook",
      "Video narration",
      "Character voices",
      "IVR system",
      "AI agent voice",
      "Presentation audio"
    ],
    recommendedModels: {
      audio: ["ElevenLabs Multilingual v2", "PlayHT 3.0", "Deepgram Aura"]
    }
  },
  {
    id: "business",
    name: "Business & Professional",
    icon: "💼",
    tasks: [
      "Business plan",
      "Presentation",
      "Financial analysis",
      "Meeting summary",
      "Proposal writing",
      "Contract review",
      "Strategy doc",
      "Executive summary"
    ],
    recommendedModels: {
      llm: ["Claude Opus 4.5", "GPT-5.2", "Gemini 3 Pro"]
    }
  },
  {
    id: "education",
    name: "Education & Learning",
    icon: "📚",
    tasks: [
      "Lesson plan",
      "Quiz creation",
      "Study guide",
      "Tutorial",
      "Explanation",
      "Practice problems",
      "Course outline",
      "Learning materials"
    ],
    recommendedModels: {
      llm: ["GPT-4.5 Turbo", "Claude Sonnet 4.5", "Gemini 2.5 Flash"],
      audio: ["ElevenLabs Multilingual v2", "Murf AI"]
    }
  },
  {
    id: "technical",
    name: "Technical & Scientific",
    icon: "🔬",
    tasks: [
      "Math problems",
      "Scientific analysis",
      "Technical docs",
      "Research papers",
      "Code optimization",
      "Architecture design",
      "System design",
      "Algorithm design"
    ],
    recommendedModels: {
      llm: ["o3-mini", "DeepSeek R1", "Claude Opus 4.5", "Gemini 3 Pro"]
    }
  }
];

// ==================== PLATFORM INFORMATION ====================

export const PLATFORMS: Platform[] = [
  {
    name: "OpenAI",
    website: "https://openai.com",
    apiDocs: "https://platform.openai.com/docs",
    logo: "🤖",
    color: "#10a37f",
    description: "Leading AI research company behind ChatGPT and GPT models"
  },
  {
    name: "Anthropic",
    website: "https://anthropic.com",
    apiDocs: "https://docs.anthropic.com",
    logo: "🎯",
    color: "#d97757",
    description: "AI safety company creating Claude models"
  },
  {
    name: "Google",
    website: "https://deepmind.google",
    apiDocs: "https://ai.google.dev",
    logo: "💎",
    color: "#4285f4",
    description: "Google's AI initiatives including Gemini and Veo"
  },
  {
    name: "DeepSeek",
    website: "https://deepseek.com",
    apiDocs: "https://api-docs.deepseek.com",
    logo: "🔬",
    color: "#0ea5e9",
    description: "Cost-effective frontier AI models from China"
  },
  {
    name: "Meta",
    website: "https://ai.meta.com",
    apiDocs: "https://llama.meta.com",
    logo: "🦙",
    color: "#0668e1",
    description: "Open-source Llama models for on-premise deployment"
  },
  {
    name: "Midjourney",
    website: "https://midjourney.com",
    apiDocs: "https://docs.midjourney.com",
    logo: "🖼️",
    color: "#ff6b6b",
    description: "Leading artistic AI image generation platform"
  },
  {
    name: "Black Forest Labs",
    website: "https://blackforestlabs.ai",
    apiDocs: "https://docs.bfl.ml",
    logo: "🎨",
    color: "#8b5cf6",
    description: "Creators of FLUX image generation models"
  },
  {
    name: "Runway",
    website: "https://runwayml.com",
    apiDocs: "https://docs.runwayml.com",
    logo: "🎥",
    color: "#8b5cf6",
    description: "Professional AI video generation and editing"
  },
  {
    name: "ElevenLabs",
    website: "https://elevenlabs.io",
    apiDocs: "https://elevenlabs.io/docs",
    logo: "🎙️",
    color: "#7c3aed",
    description: "Leading realistic voice generation and cloning"
  },
  {
    name: "Stability AI",
    website: "https://stability.ai",
    apiDocs: "https://platform.stability.ai",
    logo: "🔧",
    color: "#ec4899",
    description: "Open-source image and video generation models"
  }
];

// ==================== SMART RECOMMENDATION ENGINE ====================

export function getSmartRecommendations(criteria: RecommendationCriteria) {
  const task = TASK_CATEGORIES.find(t => 
    t.tasks.some(task => 
      task.toLowerCase().includes(criteria.taskType.toLowerCase())
    )
  );

  if (!task) return null;

  const recommendations: any = {
    primary: [],
    alternatives: [],
    reasoning: []
  };

  // LLM Recommendations
  if (task.recommendedModels?.llm) {
    const llmModels = LLM_MODELS.filter(m => 
      task.recommendedModels.llm?.includes(m.name)
    );

    if (criteria.priority === 'cost') {
      recommendations.primary.push(...llmModels.filter(m => m.tier === 'value' || m.tier === 'efficient'));
      recommendations.reasoning.push("Prioritizing cost-effective models");
    } else if (criteria.priority === 'quality') {
      recommendations.primary.push(...llmModels.filter(m => m.tier === 'flagship' || m.tier === 'premium'));
      recommendations.reasoning.push("Prioritizing highest quality models");
    } else if (criteria.priority === 'speed') {
      recommendations.primary.push(...llmModels.filter(m => m.tier === 'efficient'));
      recommendations.reasoning.push("Prioritizing fast response models");
    } else if (criteria.priority === 'eco-friendly') {
      recommendations.primary.push(...llmModels.filter(m => 
        m.co2Emissions?.rating === 'very-low' || m.co2Emissions?.rating === 'low'
      ).sort((a, b) => {
        const ratingOrder: Record<string, number> = { 'very-low': 1, 'low': 2, 'low-medium': 3, 'medium': 4 };
        return (ratingOrder[a.co2Emissions?.rating || ''] || 99) - (ratingOrder[b.co2Emissions?.rating || ''] || 99);
      }));
      recommendations.reasoning.push("Prioritizing environmentally friendly models with lowest CO₂ emissions");
    } else {
      recommendations.primary.push(...llmModels.slice(0, 2));
    }
  }

  // Image Recommendations
  if (task.recommendedModels?.image) {
    const imageModels = IMAGE_MODELS.filter(m => 
      task.recommendedModels.image?.includes(m.name)
    );

    if (criteria.budget === 'free') {
      recommendations.primary.push(...imageModels.filter(m => 
        m.tier === 'open-source' || m.pricing.includes('Free')
      ));
    } else if (criteria.priority === 'eco-friendly') {
      recommendations.primary.push(...imageModels.filter(m => 
        m.co2Emissions?.rating === 'low' || m.co2Emissions?.rating === 'very-low'
      ));
    } else {
      recommendations.primary.push(...imageModels.slice(0, 2));
    }
  }

  // Video Recommendations
  if (task.recommendedModels?.video) {
    const videoModels = VIDEO_MODELS.filter(m => 
      task.recommendedModels.video?.includes(m.name)
    );
    
    if (criteria.priority === 'eco-friendly') {
      recommendations.primary.push(...videoModels.filter(m => 
        m.co2Emissions?.rating === 'low' || m.co2Emissions?.rating === 'low-medium'
      ));
    } else {
      recommendations.primary.push(...videoModels.slice(0, 2));
    }
  }

  // Audio Recommendations
  if (task.recommendedModels?.audio) {
    const audioModels = AUDIO_MODELS.filter(m => 
      task.recommendedModels.audio?.includes(m.name)
    );
    
    if (criteria.priority === 'eco-friendly') {
      recommendations.primary.push(...audioModels.filter(m => 
        m.co2Emissions?.rating === 'very-low' || m.co2Emissions?.rating === 'low'
      ));
    } else {
      recommendations.primary.push(...audioModels.slice(0, 2));
    }
  }

  return recommendations;
}

// ==================== CO2 RATING HELPERS ====================

export const CO2_RATING_INFO: Record<string, {
  color: string;
  icon: string;
  label: string;
  description: string;
}> = {
  'very-low': {
    color: '#22c55e',
    icon: '🌱',
    label: 'Very Low Impact',
    description: 'Minimal environmental impact'
  },
  'low': {
    color: '#84cc16',
    icon: '🍃',
    label: 'Low Impact',
    description: 'Below average emissions'
  },
  'low-medium': {
    color: '#eab308',
    icon: '⚠️',
    label: 'Low-Medium Impact',
    description: 'Slightly below average emissions'
  },
  'medium': {
    color: '#f59e0b',
    icon: '🔶',
    label: 'Medium Impact',
    description: 'Average emissions'
  },
  'medium-high': {
    color: '#f97316',
    icon: '🔸',
    label: 'Medium-High Impact',
    description: 'Above average emissions'
  },
  'high': {
    color: '#ef4444',
    icon: '⚡',
    label: 'High Impact',
    description: 'High emissions'
  },
  'very-high': {
    color: '#dc2626',
    icon: '🔥',
    label: 'Very High Impact',
    description: 'Very high emissions'
  }
};

export function getCO2RatingColor(rating: string): string {
  return CO2_RATING_INFO[rating]?.color || '#6b7280';
}

export function getCO2RatingIcon(rating: string): string {
  return CO2_RATING_INFO[rating]?.icon || '📊';
}

export function getCO2RatingLabel(rating: string): string {
  return CO2_RATING_INFO[rating]?.label || 'Unknown';
}

export function getCO2RatingDescription(rating: string): string {
  return CO2_RATING_INFO[rating]?.description || 'No information available';
}

// ==================== UTILITY FUNCTIONS ====================

export function getModelsByPlatform(platform: string): ModelRecommendation[] {
  return [
    ...LLM_MODELS,
    ...IMAGE_MODELS,
    ...VIDEO_MODELS,
    ...AUDIO_MODELS
  ].filter(model => model.platform === platform);
}

export function getModelsByTier(tier: string): ModelRecommendation[] {
  return [
    ...LLM_MODELS,
    ...IMAGE_MODELS,
    ...VIDEO_MODELS,
    ...AUDIO_MODELS
  ].filter(model => model.tier === tier);
}

export function getEcoFriendlyModels(maxRating: 'very-low' | 'low' | 'low-medium' | 'medium' = 'low'): ModelRecommendation[] {
  const ratingOrder: Record<string, number> = {
    'very-low': 1,
    'low': 2,
    'low-medium': 3,
    'medium': 4,
    'medium-high': 5,
    'high': 6,
    'very-high': 7
  };
  
  const maxValue = ratingOrder[maxRating];
  
  return [
    ...LLM_MODELS,
    ...IMAGE_MODELS,
    ...VIDEO_MODELS,
    ...AUDIO_MODELS
  ].filter(model => {
    if (!model.co2Emissions) return false;
    const modelRating = ratingOrder[model.co2Emissions.rating];
    return modelRating <= maxValue;
  });
}

export function compareModelEmissions(model1: ModelRecommendation, model2: ModelRecommendation): number {
  const ratingOrder: Record<string, number> = {
    'very-low': 1,
    'low': 2,
    'low-medium': 3,
    'medium': 4,
    'medium-high': 5,
    'high': 6,
    'very-high': 7
  };
  
  const rating1 = ratingOrder[model1.co2Emissions?.rating || 'medium'];
  const rating2 = ratingOrder[model2.co2Emissions?.rating || 'medium'];
  
  return rating1 - rating2;
}