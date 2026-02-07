export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b(please|kindly|can you)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
