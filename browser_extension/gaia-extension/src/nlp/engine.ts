import { normalize } from "./normalize";
import { extractTopic } from "./extractTopic";
import { generatePromptSuggestions, PromptSuggestion } from "./promptGenerator";

/**
 * Analyzes a raw user prompt and generates structured prompt suggestions
 * @param raw - The raw input string from the user
 * @returns Array of prompt suggestions or null if input is invalid
 */
export function analyzePrompt(raw: string): PromptSuggestion[] | null {
  // Validate input
  if (!raw || typeof raw !== "string") {
    return null;
  }

  const trimmedRaw = raw.trim();
  
  // Minimum viable prompt length (adjusted for meaningful content)
  if (trimmedRaw.length < 3) {
    return null;
  }

  // Maximum reasonable prompt length to prevent abuse
  if (trimmedRaw.length > 5000) {
    return null;
  }

  try {
    // Step 1: Normalize the input
    const cleaned = normalize(trimmedRaw);
    
    // Check if normalization resulted in empty string
    if (!cleaned || cleaned.length === 0) {
      return null;
    }

    // Step 2: Extract the core topic
    const topic = extractTopic(cleaned);
    
    // Validate extracted topic
    if (!topic || topic.length === 0) {
      return null;
    }

    // Topic should have at least one meaningful word
    if (topic.split(/\s+/).filter(word => word.length > 0).length === 0) {
      return null;
    }

    // Step 3: Generate prompt suggestions
    return generatePromptSuggestions(topic);
  } catch (error) {
    // Log error in production environment
    console.error("Error analyzing prompt:", error);
    return null;
  }
}