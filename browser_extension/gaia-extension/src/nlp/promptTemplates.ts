/**
 * Available prompt template types
 */
export type PromptType = 
  | "short"
  | "detailed"
  | "stepByStep"
  | "research"
  | "reasoning"
  | "creative";

/**
 * Default word counts for each prompt type
 */
const DEFAULT_WORD_COUNTS: Record<PromptType, number> = {
  short: 150,
  detailed: 500,
  stepByStep: 400,
  research: 800,
  reasoning: 400,
  creative: 300,
};

/**
 * Sanitizes a topic string to ensure it's safe for use in prompts
 * @param topic - The topic to sanitize
 * @returns Sanitized topic string
 */
function sanitizeTopic(topic: string): string {
  return topic
    .trim()
    // Capitalize first letter if it's all lowercase
    .replace(/^[a-z]/, (char) => char.toUpperCase());
}

/**
 * Validates word count parameter
 * @param wordCount - The word count to validate
 * @param defaultCount - The default to use if invalid
 * @returns Valid word count
 */
function validateWordCount(wordCount: number | undefined, defaultCount: number): number {
  if (wordCount === undefined) {
    return defaultCount;
  }
  
  // Ensure word count is reasonable (between 50 and 2000)
  if (typeof wordCount !== "number" || wordCount < 50) {
    return Math.max(50, defaultCount);
  }
  
  if (wordCount > 2000) {
    return Math.min(2000, defaultCount);
  }
  
  return Math.round(wordCount);
}

/**
 * Template functions for generating different styles of prompts
 */
export const PROMPT_TEMPLATES: Record<
  PromptType,
  (topic: string, words?: number) => string
> = {
  /**
   * Short, concise explanation in bullet points
   */
  short: (topic: string, words?: number): string => {
    const sanitized = sanitizeTopic(topic);
    const wordCount = validateWordCount(words, DEFAULT_WORD_COUNTS.short);
    return `Explain ${sanitized} briefly in 3–4 bullet points. Answer in approximately ${wordCount} words.`;
  },

  /**
   * Comprehensive detailed explanation with examples
   */
  detailed: (topic: string, words?: number): string => {
    const sanitized = sanitizeTopic(topic);
    const wordCount = validateWordCount(words, DEFAULT_WORD_COUNTS.detailed);
    return `Explain ${sanitized} in detail with clear explanations and examples. Answer in approximately ${wordCount} words.`;
  },

  /**
   * Step-by-step breakdown for beginners
   */
  stepByStep: (topic: string, words?: number): string => {
    const sanitized = sanitizeTopic(topic);
    const wordCount = validateWordCount(words, DEFAULT_WORD_COUNTS.stepByStep);
    return `Explain ${sanitized} step by step, assuming the reader is a beginner. Answer in approximately ${wordCount} words.`;
  },

  /**
   * Research-style structured explanation
   */
  research: (topic: string, words?: number): string => {
    const sanitized = sanitizeTopic(topic);
    const wordCount = validateWordCount(words, DEFAULT_WORD_COUNTS.research);
    return `Provide a structured, research-style explanation of ${sanitized}. Include headings and key points. Answer in approximately ${wordCount} words.`;
  },

  /**
   * Reasoning-focused explanation with logic
   */
  reasoning: (topic: string, words?: number): string => {
    const sanitized = sanitizeTopic(topic);
    const wordCount = validateWordCount(words, DEFAULT_WORD_COUNTS.reasoning);
    return `Explain why ${sanitized} works the way it does. Include logical reasoning and examples. Answer in approximately ${wordCount} words.`;
  },

  /**
   * Creative explanation using analogies
   */
  creative: (topic: string, words?: number): string => {
    const sanitized = sanitizeTopic(topic);
    const wordCount = validateWordCount(words, DEFAULT_WORD_COUNTS.creative);
    return `Explain ${sanitized} using a creative or intuitive analogy that is easy to understand. Answer in approximately ${wordCount} words.`;
  },
};

/**
 * Get default word count for a prompt type
 * @param type - The prompt type
 * @returns Default word count
 */
export function getDefaultWordCount(type: PromptType): number {
  return DEFAULT_WORD_COUNTS[type];
}

/**
 * Validates if a prompt type is valid
 * @param type - The type to validate
 * @returns True if the type is valid
 */
export function isValidPromptType(type: string): type is PromptType {
  return type in PROMPT_TEMPLATES;
}