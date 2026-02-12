/**
 * Common question prefixes that should be removed to extract the core topic
 */
const QUESTION_PREFIXES = [
  // Question words
  /^what (is|are|was|were|does|do|did|can|could|would|should)\s+/i,
  /^how (does|do|did|can|could|would|should|is|are|to)\s+/i,
  /^why (is|are|was|were|does|do|did|can|could|would|should)\s+/i,
  /^when (is|are|was|were|does|do|did|can|could|would|should)\s+/i,
  /^where (is|are|was|were|does|do|did|can|could|would|should)\s+/i,
  /^who (is|are|was|were|does|do|did|can|could|would|should)\s+/i,
  /^which (is|are|was|were|does|do|did|can|could|would|should)\s+/i,
  
  // Command/request words
  /^(explain|describe|define|tell me about|give me|show me|teach me about)\s+/i,
  /^(help me understand|help me with|i need to know about|i want to learn about)\s+/i,
  /^(can you explain|could you explain|can you tell me|could you tell me)\s+/i,
  
  // Articles after removal
  /^(the|a|an)\s+/i,
];

/**
 * Extracts the core topic from a normalized prompt by removing question prefixes
 * @param prompt - The normalized prompt text
 * @returns The extracted topic/subject
 */
export function extractTopic(prompt: string): string {
  if (!prompt || typeof prompt !== "string") {
    return "";
  }

  let topic = prompt.trim();

  // Apply all prefix removal patterns
  for (const pattern of QUESTION_PREFIXES) {
    topic = topic.replace(pattern, "");
  }

  // Remove any remaining leading/trailing articles
  topic = topic.replace(/^(the|a|an)\s+/i, "");
  
  // Clean up any double spaces created by removals
  topic = topic.replace(/\s+/g, " ").trim();

  return topic;
}

/**
 * Validates if an extracted topic is meaningful
 * @param topic - The extracted topic to validate
 * @returns True if topic is valid and meaningful
 */
export function isValidTopic(topic: string): boolean {
  if (!topic || typeof topic !== "string") {
    return false;
  }

  const trimmed = topic.trim();
  
  // Must have minimum length
  if (trimmed.length < 2) {
    return false;
  }

  // Must contain at least one alphabetic character
  if (!/[a-z]/i.test(trimmed)) {
    return false;
  }

  // Should have at least one word
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) {
    return false;
  }

  return true;
}