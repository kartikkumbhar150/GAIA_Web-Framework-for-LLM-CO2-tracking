import { normalize } from "./normalize";
import { extractTopic } from "./extractTopic";
import { generatePromptSuggestions } from "./promptGenerator";

export function analyzePrompt(raw: string) {
  if (raw.length < 5) return null;

  const cleaned = normalize(raw);
  const topic = extractTopic(cleaned);

  if (!topic) return null;

  return generatePromptSuggestions(topic);
}
