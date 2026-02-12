import { PROMPT_TEMPLATES, PromptType } from "./promptTemplates";

/**
 * Represents a single prompt suggestion with its type and generated text
 */
export interface PromptSuggestion {
  type: string;
  prompt: string;
}

/**
 * Configuration for prompt generation
 */
interface PromptGenerationConfig {
  includeAllTypes?: boolean;
  customWordCounts?: Partial<Record<PromptType, number>>;
}

/**
 * Generates a comprehensive set of prompt suggestions for a given topic
 * @param topic - The extracted topic to generate prompts for
 * @param config - Optional configuration for prompt generation
 * @returns Array of prompt suggestions with different styles
 */
export function generatePromptSuggestions(
  topic: string,
  config: PromptGenerationConfig = {}
): PromptSuggestion[] {
  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    throw new Error("Invalid topic: topic must be a non-empty string");
  }

  const cleanTopic = topic.trim();
  const { customWordCounts = {} } = config;

  // Define the order and types of suggestions
  const suggestionTypes: Array<{ type: PromptType; label: string }> = [
    { type: "short", label: "Short Answer" },
    { type: "detailed", label: "Detailed Explanation" },
    { type: "stepByStep", label: "Step by Step" },
    { type: "research", label: "Research Style" },
    { type: "reasoning", label: "Reasoning Based" },
    { type: "creative", label: "Creative Explanation" },
  ];

  // Generate suggestions
  const suggestions: PromptSuggestion[] = suggestionTypes.map(({ type, label }) => {
    const wordCount = customWordCounts[type];
    const prompt = PROMPT_TEMPLATES[type](cleanTopic, wordCount);

    return {
      type: label,
      prompt: prompt,
    };
  });

  return suggestions;
}

/**
 * Generates a single prompt suggestion of a specific type
 * @param topic - The topic to generate a prompt for
 * @param type - The type of prompt to generate
 * @param wordCount - Optional custom word count
 * @returns A single prompt suggestion
 */
export function generateSinglePrompt(
  topic: string,
  type: PromptType,
  wordCount?: number
): PromptSuggestion | null {
  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    return null;
  }

  if (!PROMPT_TEMPLATES[type]) {
    return null;
  }

  const cleanTopic = topic.trim();
  const typeLabels: Record<PromptType, string> = {
    short: "Short Answer",
    detailed: "Detailed Explanation",
    stepByStep: "Step by Step",
    research: "Research Style",
    reasoning: "Reasoning Based",
    creative: "Creative Explanation",
  };

  return {
    type: typeLabels[type],
    prompt: PROMPT_TEMPLATES[type](cleanTopic, wordCount),
  };
}

/**
 * Validates if a prompt suggestion is properly formed
 * @param suggestion - The suggestion to validate
 * @returns True if the suggestion is valid
 */
export function isValidSuggestion(suggestion: PromptSuggestion): boolean {
  return (
    suggestion !== null &&
    typeof suggestion === "object" &&
    typeof suggestion.type === "string" &&
    suggestion.type.length > 0 &&
    typeof suggestion.prompt === "string" &&
    suggestion.prompt.length > 0
  );
}