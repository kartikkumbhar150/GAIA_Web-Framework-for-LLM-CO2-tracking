export function extractTopic(prompt: string): string {
  return prompt
    .replace(/^(explain|describe|what is|define|tell me about)\s+/i, "")
    .trim();
}
