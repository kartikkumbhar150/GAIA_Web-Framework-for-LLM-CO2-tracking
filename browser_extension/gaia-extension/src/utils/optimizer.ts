export function optimizePrompt(prompt: string): string {
  return prompt
    .replace(/please|kindly|as much as possible/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
