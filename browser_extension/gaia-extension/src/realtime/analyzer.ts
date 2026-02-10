import { analyzePrompt } from "../nlp/engine";
import type { PromptSuggestion } from "../nlp/types";

export function debounce(fn: Function, delay = 350) {
  let timer: number;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

//  helper: get JWT safely
function getToken(): Promise<string | null> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "GET_TOKEN" }, res => {
      resolve(res?.token || null);
    });
  });
}

export const analyzeRealtime = debounce(
  async (
    text: string,
    callback: (suggestions: PromptSuggestion[] | null) => void
  ) => {

    //  Local NLP (instant UX)
    const localSuggestions = analyzePrompt(text);
    callback(localSuggestions);

    //  Backend AI (JWT protected)
    const token = await getToken();
    if (!token) {
      console.warn("GAIA: user not authenticated");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      if (!res.ok) throw new Error("Unauthorized");

      const serverSuggestions: PromptSuggestion[] = await res.json();

      // 3Merge / override suggestions
      callback(serverSuggestions);

    } catch (err) {
      console.error("GAIA analyze error:", err);
    }
  },
  350
);
