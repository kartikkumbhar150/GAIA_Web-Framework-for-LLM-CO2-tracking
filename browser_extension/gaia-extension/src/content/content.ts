console.log("GAIA content script loaded");

function getPromptText(): string {
  const box = document.querySelector('[contenteditable="true"]') as HTMLElement | null;
  return box?.innerText || "";
}


setInterval(() => {
  const prompt = getPromptText();
  if (prompt.length > 20) {
    chrome.runtime.sendMessage({
      type: "PROMPT_UPDATE",
      text: prompt,
      platform: location.hostname.includes("openai") ? "chatgpt" : "gemini"
    });
  }
}, 1500);
