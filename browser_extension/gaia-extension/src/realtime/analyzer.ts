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
  (
    text: string,
    callback: (suggestions: PromptSuggestion[] | null) => void
  ) => {
    const suggestions = analyzePrompt(text);
    callback(suggestions);
  },
  350
);
