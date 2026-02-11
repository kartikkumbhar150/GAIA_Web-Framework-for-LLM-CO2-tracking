import { analyzePrompt } from "../nlp/engine";
import type { PromptSuggestion } from "../nlp/types";

export function debounce(fn: Function, delay = 350) {
  let timer: number;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

export const analyzeRealtime = debounce(
  async (
    text: string,
    callback: (suggestions: PromptSuggestion[] | null) => void
  ) => {

    // ✅ Only local NLP
    const localSuggestions = analyzePrompt(text);
    callback(localSuggestions);

    // ❌ NO backend login call
    // ❌ NO fetch to 3000
    // ❌ NO fetch to 3001 here
  },
  350
);
