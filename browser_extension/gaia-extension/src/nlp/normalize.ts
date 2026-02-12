/**
 * Normalizes user input by removing noise words and standardizing format
 * @param text - The raw text to normalize
 * @returns Cleaned and normalized text
 */
export function normalize(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    // Convert to lowercase for case-insensitive processing
    .toLowerCase()
    
    // Remove common filler words and politeness markers
    .replace(/\b(please|kindly|can you|could you|would you|will you)\b/gi, "")
    
    // Remove question words at the start that don't add semantic value
    .replace(/^(um+|uh+|er+|ah+)\s+/gi, "")
    
    // Remove excessive punctuation
    .replace(/[!?]{2,}/g, "?")
    .replace(/\.{2,}/g, ".")
    
    // Normalize whitespace (replace multiple spaces, tabs, newlines with single space)
    .replace(/\s+/g, " ")
    
    // Remove leading/trailing whitespace
    .trim()
    
    // Remove trailing question marks and periods (will be added back in templates if needed)
    .replace(/[?.!]+$/, "")
    
    // Final trim
    .trim();
}

/**
 * Checks if normalized text contains meaningful content
 * @param normalized - The normalized text to check
 * @returns True if text has meaningful content
 */
export function hasMeaningfulContent(normalized: string): boolean {
  if (!normalized) return false;
  
  // Check if there are actual words (not just punctuation/numbers)
  const words = normalized.match(/\b[a-z]+\b/gi);
  return words !== null && words.length > 0;
}