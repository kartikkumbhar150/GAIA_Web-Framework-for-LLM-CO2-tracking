// ===============================
// GAIA Background Script
// ===============================

// ---------- 1. TOKEN ESTIMATION ----------
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ---------- 2. HANDLE PROMPT UPDATES ----------
chrome.runtime.onMessage.addListener(
  (
    msg: {
      type: string;
      text?: string;
      platform?: string;
      tokensBefore?: number;
      tokensAfter?: number;
    },
    sender: chrome.runtime.MessageSender,
    sendResponse
  ) => {
    if (msg.type === "PROMPT_UPDATE") {
      const tokensBefore =
        msg.tokensBefore ?? estimateTokens(msg.text || "");

      chrome.storage.local.set({
        tokensBefore,
        tokensAfter: msg.tokensAfter,
        platform: msg.platform
      });

      // (optional) console log for debugging
      console.log("GAIA metrics stored:", {
        tokensBefore,
        tokensAfter: msg.tokensAfter,
        platform: msg.platform
      });
    }

    return true;
  }
);

// ---------- 3. EXTENSION ICON CLICK → TOGGLE PANEL ----------
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  // Sirf ChatGPT / Gemini pe allow
  if (
    !tab.url.includes("chat.openai.com") &&
    !tab.url.includes("gemini.google.com")
  ) {
    return;
  }

  try {
    // Try sending message
    await chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_GAIA_PANEL"
    });
  } catch (err) {
    // Content script not injected → inject it
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    // Retry message
    await chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_GAIA_PANEL"
    });
  }
});
