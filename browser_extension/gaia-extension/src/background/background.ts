chrome.runtime.onMessage.addListener(
  (
    msg: { type: string; text?: string; platform?: string },
    sender: chrome.runtime.MessageSender
  ) => {
    if (msg.type === "PROMPT_UPDATE") {
      const tokensBefore = estimateTokens(msg.text || "");

      chrome.storage.local.set({
        tokensBefore,
        platform: msg.platform
      });
    }
  }
);

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
