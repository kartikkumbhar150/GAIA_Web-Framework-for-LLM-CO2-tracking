import { analyzeRealtime } from "../realtime/analyzer";
import type { PromptSuggestion } from "../nlp/types";

console.log("🚀 GAIA Assistant v3.3 - Production Ready");

// ==================== TYPE DEFINITIONS ====================

interface Metrics {
  site: string;
  model: string;
  input_tokens_before: number;
  input_tokens_after: number;
  output_tokens: number;
  total_tokens: number;
  timestamp: number;
  session_id: string;
  is_cached?: boolean;
  cloud_provider?: string;
  cloud_region?: string;
}

interface StorageResult {
  failedMetrics?: Metrics[];
}

interface AuthResponse {
  token?: string;
}

// ==================== STATE MANAGEMENT ====================

let gaiaIcon: HTMLDivElement | null = null;
let gaiaPopup: HTMLDivElement | null = null;

// Token tracking - matching backend fields
let inputTokensBefore = 0;      // Tokens from user's ORIGINAL typed prompt
let inputTokensAfter = 0;       // Tokens from SELECTED suggestion prompt
let outputTokens = 0;           // Extracted from selected prompt's word count
let currentPromptText = "";     // User's original typed text
let selectedPromptText = "";    // Selected suggestion text
let listenersAttached = false;

// Session tracking
const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Debouncing
let typingTimer: ReturnType<typeof setTimeout>;
const TYPING_DELAY = 300;

// API Configuration


const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const API_TIMEOUT = 10000;

// Error tracking
let consecutiveErrors = 0;
let apiHealthy = true;

// ==================== CONFIGURATION ====================

const BRAND_COLORS = {
  primary: "#10b981",
  primaryDark: "#059669",
  primaryLight: "#d1fae5",
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827"
};

// ==================== UTILITY FUNCTIONS ====================

function isLoggedIn(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: "GET_TOKEN" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Runtime error:", chrome.runtime.lastError.message);
          resolve(false);
          return;
        }
        const isAuth = !!response?.token;
        console.log(`🔐 Auth status: ${isAuth ? "✓ Logged in" : "✗ Not logged in"}`);
        resolve(isAuth);
      });
    } catch (error) {
      console.error("❌ Error checking auth:", error);
      resolve(false);
    }
  });
}

function detectSite(): string {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes("chat.openai.com")) return "ChatGPT";
  if (hostname.includes("claude.ai")) return "Claude";
  if (hostname.includes("bard.google.com")) return "Bard";
  if (hostname.includes("gemini.google.com")) return "Gemini";
  if (hostname.includes("copilot.microsoft.com")) return "Copilot";
  
  return "Unknown";
}

const currentSite = detectSite();

/**
 * Calculate accurate token count using multiple heuristics
 * Based on empirical analysis of GPT-3.5/4 and Claude tokenizers
 */
function approxTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  // Character-based baseline (most reliable for short texts)
  const charCount = text.length;
  let tokenCount = Math.ceil(charCount / 4); // ~4 chars per token average

  // Word-based adjustment
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordEstimate = Math.ceil(words.length * 1.3); // ~1.3 tokens per word

  // Use the higher of the two estimates for accuracy
  tokenCount = Math.max(tokenCount, wordEstimate);

  // Special content adjustments
  const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
  const inlineCode = (text.match(/`[^`]+`/g) || []).length;
  const urls = (text.match(/https?:\/\/[^\s]+/g) || []).length;
  const emails = (text.match(/\S+@\S+\.\S+/g) || []).length;
  const numbers = (text.match(/\d+/g) || []).length;
  const punctuation = (text.match(/[.,!?;:(){}[\]<>'"]/g) || []).length;
  
  // Code blocks use more tokens
  tokenCount += codeBlocks * 50;
  tokenCount += inlineCode * 3;
  
  // URLs and emails are compact
  tokenCount += urls * 4;
  tokenCount += emails * 3;
  
  // Numbers and punctuation
  tokenCount += Math.ceil(numbers * 0.4);
  tokenCount += Math.ceil(punctuation * 0.3);
  
  // Language complexity adjustment
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
  if (avgWordLength > 8) {
    tokenCount = Math.ceil(tokenCount * 1.15); // Technical/complex text
  }
  
  // Final safety margin (tokenizers vary)
  tokenCount = Math.ceil(tokenCount * 1.1);
  
  return Math.max(tokenCount, 1);
}

/**
 * Extract output tokens from prompt text
 * Looks for patterns like "150 words", "200 words", etc. at the END of the prompt
 * Returns 0 if no word count found (API will still be called with 0)
 */
function extractOutputTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  // Pattern to find word count specifically at the end of the text
  // Matches: "150 words", "approximately 200 words", "in 300 words", etc.
  const endPatterns = [
    /(?:approximately|about|around|in)?\s*(\d+)\s*words?\.?\s*$/i,
    /answer in\s+(?:approximately|about|around)?\s*(\d+)\s*words?\.?\s*$/i,
    /(?:write|respond|reply)\s+in\s+(?:approximately|about|around)?\s*(\d+)\s*words?\.?\s*$/i,
  ];

  for (const pattern of endPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const wordCount = parseInt(match[1], 10);
      if (wordCount > 0 && wordCount <= 100000) {
        // Convert words to tokens (words * 1.3)
        const tokens = Math.ceil(wordCount * 1.3);
        console.log(`📝 Extracted word count from prompt: ${wordCount} words → ${tokens} tokens`);
        return tokens;
      }
    }
  }

  // Also check middle of text for backward compatibility
  const middlePatterns = [
    /\b(\d+)\s*(?:words?|tokens?)\b/i,
    /\bin\s+(\d+)\s+(?:words?|tokens?)/i,
    /\bwithin\s+(\d+)\s+(?:words?|tokens?)/i,
    /\b(?:max|maximum|limit)\s*:?\s*(\d+)\s+(?:words?|tokens?)/i,
  ];

  for (const pattern of middlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const wordCount = parseInt(match[1], 10);
      if (wordCount > 0 && wordCount <= 100000) {
        const tokens = Math.ceil(wordCount * 1.3);
        console.log(`📝 Found word count in prompt: ${wordCount} words → ${tokens} tokens`);
        return tokens;
      }
    }
  }

  console.log(`📝 No word count found in prompt, using 0 tokens`);
  return 0;
}

/**
 * Get editor element
 */
function getEditor(): HTMLElement | null {
  // ChatGPT specific
  const chatGptTextarea = document.querySelector<HTMLElement>("#prompt-textarea");
  if (chatGptTextarea) return chatGptTextarea;

  // Claude specific
  const proseMirror = document.querySelector<HTMLElement>(".ProseMirror");
  if (proseMirror) return proseMirror;

  // Generic textarea
  const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea"));
  const validTextarea = textareas.find(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 100 && rect.height > 30 && el.offsetParent !== null;
  });
  if (validTextarea) return validTextarea;

  // Contenteditable
  const editables = Array.from(
    document.querySelectorAll<HTMLElement>('[contenteditable="true"]')
  );
  const validEditable = editables.find(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 200 && rect.height > 30 && el.offsetParent !== null;
  });
  if (validEditable) return validEditable;

  // Role textbox
  const roleTextbox = document.querySelector<HTMLElement>('[role="textbox"]');
  if (roleTextbox && roleTextbox.offsetParent !== null) return roleTextbox;

  return null;
}

function getEditorText(editor: HTMLElement): string {
  if (editor.tagName === "TEXTAREA") {
    return (editor as HTMLTextAreaElement).value || "";
  }
  return editor.innerText || editor.textContent || "";
}

function setEditorText(editor: HTMLElement, text: string): void {
  if (editor.tagName === "TEXTAREA") {
    const textarea = editor as HTMLTextAreaElement;
    textarea.value = text;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    editor.textContent = text;
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.dispatchEvent(new Event("change", { bubbles: true }));
    
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  
  editor.focus();
}

// ==================== EVENT LISTENERS ====================

function attachTypingListener(editor: HTMLElement): void {
  if (listenersAttached) return;

  const handleInput = () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      const text = getEditorText(editor);
      currentPromptText = text;
      
      // Capture user's ORIGINAL typed prompt tokens
      inputTokensBefore = approxTokens(text);
      console.log(`📊 User's original prompt tokens: ${inputTokensBefore}`);
    }, TYPING_DELAY);
  };

  editor.addEventListener("input", handleInput);
  console.log("✅ Typing listener attached");
}

function attachSubmitListener(editor: HTMLElement): void {
  if (listenersAttached) return;

  const handleKeydown = (e: KeyboardEvent) => {
    const isSubmit = 
      (e.key === "Enter" && !e.shiftKey) || 
      (e.key === "Enter" && (e.ctrlKey || e.metaKey));
    
    if (isSubmit) {
      // Small delay to ensure text is captured
      setTimeout(() => captureAndSubmit(editor), 50);
    }
  };

  editor.addEventListener("keydown", handleKeydown);

  const attachButtonListener = () => {
    const submitSelectors = [
      '[data-testid="send-button"]',
      'button[aria-label*="Send" i]',
      'button[aria-label*="submit" i]',
      'button[type="submit"]',
      '[data-testid="fruitjuice-send-button"]',
      '.send-button',
      '[data-test="send-button"]'
    ];

    const submitButton = document.querySelector<HTMLButtonElement>(
      submitSelectors.join(", ")
    );

    if (submitButton && !submitButton.hasAttribute("data-gaia-listener")) {
      submitButton.setAttribute("data-gaia-listener", "true");
      submitButton.addEventListener("click", () => {
        setTimeout(() => captureAndSubmit(editor), 50);
      });
      console.log("✅ Submit button listener attached");
    }
  };

  attachButtonListener();
  const buttonCheckInterval = setInterval(attachButtonListener, 1000);

  window.addEventListener("beforeunload", () => {
    clearInterval(buttonCheckInterval);
  });

  console.log("✅ Submit listener attached");
}

/**
 * Capture final prompt state and submit metrics
 * This is called when user directly submits (without using suggestions)
 */
function captureAndSubmit(editor: HTMLElement): void {
  // Capture the absolute latest text
  const text = getEditorText(editor) || currentPromptText;

  if (!text || text.trim().length === 0) {
    console.log("⚠️ Empty prompt, skipping submission");
    return;
  }

  // Check if user selected a suggestion or typed directly
  if (selectedPromptText && selectedPromptText.trim() === text.trim()) {
    // User already selected a suggestion, metrics already sent
    console.log("ℹ️ Suggestion already selected, metrics already sent");
    return;
  }

  // User typed and submitted without selecting suggestion
  // Use current text for both before and after
  inputTokensBefore = approxTokens(currentPromptText || text);
  inputTokensAfter = approxTokens(text);
  
  // Try to extract word count from the prompt
  outputTokens = extractOutputTokens(text);

  const totalTokens = inputTokensAfter + outputTokens;

  console.log(`\n📤 DIRECT SUBMISSION (No suggestion used):`);
  console.log(`   ├─ Input (before): ${inputTokensBefore} tokens`);
  console.log(`   ├─ Input (after):  ${inputTokensAfter} tokens`);
  console.log(`   ├─ Output (est):   ${outputTokens} tokens`);
  console.log(`   ├─ Total:          ${totalTokens} tokens`);
  console.log(`   ├─ Site:           ${currentSite}`);
  console.log(`   └─ Session:        ${sessionId}\n`);

  // Send metrics to API
  sendMetrics()
    .then(() => {
      console.log("✅ Metrics sent successfully");
    })
    .catch(error => {
      console.error("❌ Failed to send metrics:", error);
    });

  // Reset for next prompt
  setTimeout(() => {
    currentPromptText = "";
    selectedPromptText = "";
    inputTokensBefore = 0;
    inputTokensAfter = 0;
    outputTokens = 0;
  }, 1000);
}

/**
 * Handle suggestion selection and send metrics
 * This is called when user clicks on a suggestion
 */
function handleSuggestionSelection(suggestionText: string, editor: HTMLElement): void {
  console.log(`\n🎯 SUGGESTION SELECTED:`);
  
  // Store the selected prompt
  selectedPromptText = suggestionText;
  
  // Calculate tokens for the SELECTED suggestion
  inputTokensAfter = approxTokens(suggestionText);
  
  // Extract word count from the END of the selected prompt
  outputTokens = extractOutputTokens(suggestionText);
  
  const totalTokens = inputTokensAfter + outputTokens;

  console.log(`   ├─ Original prompt: "${currentPromptText}"`);
  console.log(`   ├─ Selected prompt: "${suggestionText}"`);
  console.log(`   ├─ Input (before): ${inputTokensBefore} tokens (user's original)`);
  console.log(`   ├─ Input (after):  ${inputTokensAfter} tokens (selected suggestion)`);
  console.log(`   ├─ Output (est):   ${outputTokens} tokens (from word count)`);
  console.log(`   ├─ Total:          ${totalTokens} tokens`);
  console.log(`   ├─ Site:           ${currentSite}`);
  console.log(`   └─ Session:        ${sessionId}\n`);

  // Set the suggestion text in editor
  setEditorText(editor, suggestionText);

  // Send metrics to API immediately
  sendMetrics()
    .then(() => {
      console.log("✅ Suggestion metrics sent successfully");
    })
    .catch(error => {
      console.error("❌ Failed to send suggestion metrics:", error);
    });
}

// ==================== METRICS API ====================

/**
 * Send metrics to backend API with retry logic
 */
async function sendMetrics(): Promise<void> {
  try {
    const metrics = createMetricsObject();

    console.log("📊 Sending metrics via background:", metrics);

    const response = await new Promise<any>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "SEND_METRICS",
          payload: metrics
        },
        (res) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError.message);
            return;
          }

          if (res?.success) {
            resolve(res);
          } else {
            reject(res?.error || "Unknown error");
          }
        }
      );
    });

    console.log("✅ Metrics sent successfully:", response);

  } catch (error) {
    console.error("❌ Metrics failed, storing locally:", error);
    await storeFailedMetrics(createMetricsObject());
  }
}


/**
 * Create metrics object for API submission
 * Always creates object even if values are 0 - API will still be called
 */
function createMetricsObject(): Metrics {
  return {
    site: currentSite,
    model: currentSite, // Can be enhanced to detect specific model
    input_tokens_before: inputTokensBefore || 0,  // User's original typed prompt tokens
    input_tokens_after: inputTokensAfter || 0,    // Selected suggestion tokens (or final prompt)
    output_tokens: outputTokens || 0,             // Extracted from word count (or 0)
    total_tokens: (inputTokensAfter || 0) + (outputTokens || 0),
    timestamp: Date.now(),
    session_id: sessionId,
    is_cached: false,
    cloud_provider: "unknown",
    cloud_region: "unknown"
  };
}

/**
 * Get authentication token from background script
 */
function getAuthToken(): Promise<AuthResponse | null> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: "GET_TOKEN" }, (response: AuthResponse) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Runtime error:", chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(response);
      });
    } catch (error) {
      console.error("❌ Token retrieval error:", error);
      resolve(null);
    }
  });
}

/**
 * Store failed metrics locally for retry
 */
async function storeFailedMetrics(metrics: Metrics): Promise<void> {
  try {
    const result = await chrome.storage.local.get(["failedMetrics"]) as StorageResult;
    const existing: Metrics[] = result.failedMetrics || [];
    existing.push(metrics);
    
    // Keep only last 100 failed metrics
    const trimmed = existing.slice(-100);
    
    await chrome.storage.local.set({ failedMetrics: trimmed });
    console.log(`💾 Stored locally (${trimmed.length} in queue)`);
  } catch (error) {
    console.error("❌ Storage error:", error);
  }
}


// ==================== UI STYLES ====================

function injectStyles(): void {
  if (document.getElementById("gaia-styles")) return;

  const style = document.createElement("style");
  style.id = "gaia-styles";
  style.textContent = `
    @keyframes gaia-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-4px); }
    }

    @keyframes gaia-glow {
      0%, 100% { 
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4); 
      }
      50% { 
        box-shadow: 0 6px 24px rgba(16, 185, 129, 0.6); 
      }
    }

    @keyframes gaia-slideUp {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes gaia-spin {
      to { transform: rotate(360deg); }
    }

    .gaia-icon {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
      user-select: none;
    }

    .gaia-icon:hover {
      transform: scale(1.15) translateY(-3px) !important;
      box-shadow: 0 8px 28px rgba(16, 185, 129, 0.6) !important;
    }

    .gaia-icon:active {
      transform: scale(1.05) !important;
    }

    .gaia-suggestion-card {
      background: ${BRAND_COLORS.white};
      border: 2px solid ${BRAND_COLORS.gray200};
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .gaia-suggestion-card:hover {
      background: ${BRAND_COLORS.primaryLight};
      border-color: ${BRAND_COLORS.primary};
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
    }

    .gaia-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid ${BRAND_COLORS.gray200};
      border-top-color: ${BRAND_COLORS.primary};
      border-radius: 50%;
      animation: gaia-spin 0.8s linear infinite;
    }

    .gaia-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .gaia-scrollbar::-webkit-scrollbar {
      width: 8px;
    }

    .gaia-scrollbar::-webkit-scrollbar-track {
      background: ${BRAND_COLORS.gray100};
      border-radius: 4px;
    }

    .gaia-scrollbar::-webkit-scrollbar-thumb {
      background: ${BRAND_COLORS.primary};
      border-radius: 4px;
    }

    .gaia-scrollbar::-webkit-scrollbar-thumb:hover {
      background: ${BRAND_COLORS.primaryDark};
    }
  `;

  document.head.appendChild(style);
}

// ==================== ICON INJECTION ====================

function injectGaiaIcon(): void {
  if (gaiaIcon) return;

  const editor = getEditor();
  if (!editor) return;

  if (!listenersAttached) {
    attachTypingListener(editor);
    attachSubmitListener(editor);
    listenersAttached = true;
  }

  const rect = editor.getBoundingClientRect();

  gaiaIcon = document.createElement("div");
  gaiaIcon.className = "gaia-icon";
  
  Object.assign(gaiaIcon.style, {
    position: "fixed",
    bottom: `${window.innerHeight - rect.bottom + 12}px`,
    right: `${window.innerWidth - rect.right + 12}px`,
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: "999999",
    boxShadow: `0 4px 16px rgba(16, 185, 129, 0.4)`,
    fontFamily: "system-ui, -apple-system, sans-serif",
    animation: "gaia-float 3s ease-in-out infinite, gaia-glow 2.5s ease-in-out infinite"
  });

  gaiaIcon.innerHTML = `
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="20" y="28" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="28" font-weight="800" fill="${BRAND_COLORS.white}">G</text>
    </svg>
  `;

  gaiaIcon.onclick = togglePopup;
  document.body.appendChild(gaiaIcon);

  console.log("✅ Icon injected");
}

// ==================== POPUP UI ====================

function togglePopup(): void {
  if (gaiaPopup) {
    gaiaPopup.style.opacity = "0";
    gaiaPopup.style.transform = "translateY(12px) scale(0.95)";
    
    setTimeout(() => {
      gaiaPopup?.remove();
      gaiaPopup = null;
    }, 200);
    return;
  }

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();
  const text = currentPromptText || getEditorText(editor);

  gaiaPopup = document.createElement("div");
  gaiaPopup.className = "gaia-scrollbar";
  
  Object.assign(gaiaPopup.style, {
    position: "fixed",
    bottom: `${window.innerHeight - rect.bottom + 72}px`,
    right: `${window.innerWidth - rect.right + 12}px`,
    width: "400px",
    maxHeight: "520px",
    overflowY: "auto",
    background: BRAND_COLORS.white,
    borderRadius: "16px",
    padding: "0",
    zIndex: "999998",
    boxShadow: `0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px ${BRAND_COLORS.gray200}`,
    fontFamily: "system-ui, -apple-system, sans-serif",
    animation: "gaia-slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    opacity: "0",
    transform: "translateY(12px) scale(0.95)"
  });

  document.body.appendChild(gaiaPopup);

  requestAnimationFrame(() => {
    if (gaiaPopup) {
      gaiaPopup.style.opacity = "1";
      gaiaPopup.style.transform = "translateY(0) scale(1)";
    }
  });

  gaiaPopup.innerHTML = `
    <div style="padding: 24px; text-align: center;">
      <div class="gaia-spinner" style="width: 36px; height: 36px; border-width: 3px; margin: 0 auto 16px;"></div>
      <div style="color: ${BRAND_COLORS.gray600}; font-size: 15px; font-weight: 600;">
        Analyzing prompt...
      </div>
    </div>
  `;

  analyzeRealtime(text, (suggestions: PromptSuggestion[] | null) => {
    if (!gaiaPopup) return;

    if (!suggestions || suggestions.length === 0) {
      gaiaPopup.innerHTML = `
        <div style="padding: 28px;">
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%); display: flex; align-items: center; justify-content: center; font-size: 28px;">
              ✨
            </div>
            <div>
              <div style="font-size: 20px; font-weight: 800; color: ${BRAND_COLORS.gray900}; margin-bottom: 4px;">
                Perfect!
              </div>
              <div style="font-size: 14px; color: ${BRAND_COLORS.gray500};">
                Your prompt is optimized
              </div>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primaryLight} 0%, ${BRAND_COLORS.white} 100%); border: 2px solid ${BRAND_COLORS.primary}; border-radius: 12px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 13px; color: ${BRAND_COLORS.gray700}; font-weight: 600;">Input Tokens</span>
              <span style="font-size: 20px; font-weight: 800; color: ${BRAND_COLORS.primary};">${inputTokensBefore}</span>
            </div>
            <div style="height: 1px; background: ${BRAND_COLORS.primary}; opacity: 0.2; margin: 12px 0;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; color: ${BRAND_COLORS.gray700}; font-weight: 600;">Platform</span>
              <span class="gaia-badge" style="background: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.white};">${currentSite}</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    gaiaPopup.innerHTML = `
      <div style="padding: 24px;">
        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <h3 style="font-size: 18px; font-weight: 800; color: ${BRAND_COLORS.gray900}; margin: 0;">
              💡 Smart Suggestions
            </h3>
            <span class="gaia-badge" style="background: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.white};">
              ${suggestions.length}
            </span>
          </div>
          <p style="font-size: 14px; color: ${BRAND_COLORS.gray500}; margin: 0;">
            Click to apply
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
          ${suggestions.map((s, i) => `
            <div class="gaia-suggestion-card" data-index="${i}">
              <div style="display: flex; gap: 12px;">
                <div style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px; background: ${BRAND_COLORS.primaryLight}; display: flex; align-items: center; justify-content: center; border: 2px solid ${BRAND_COLORS.primary};">
                  <span style="font-size: 20px;">${getTypeIcon(s.type)}</span>
                </div>
                <div style="flex: 1;">
                  <div style="font-size: 11px; font-weight: 700; color: ${BRAND_COLORS.primary}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                    ${s.type}
                  </div>
                  <div style="font-size: 14px; color: ${BRAND_COLORS.gray700}; line-height: 1.6;">
                    ${s.prompt}
                  </div>
                </div>
              </div>
            </div>
          `).join("")}
        </div>

        <div style="background: ${BRAND_COLORS.gray50}; border-radius: 10px; padding: 14px; border: 1px solid ${BRAND_COLORS.gray200};">
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: ${BRAND_COLORS.gray600};">Tokens: <strong style="color: ${BRAND_COLORS.primary};">${inputTokensBefore}</strong></span>
            <span style="color: ${BRAND_COLORS.gray600};">Site: <strong style="color: ${BRAND_COLORS.gray800};">${currentSite}</strong></span>
          </div>
        </div>
      </div>
    `;

    gaiaPopup.querySelectorAll("[data-index]").forEach((el) => {
      el.addEventListener("click", () => {
        const index = Number((el as HTMLElement).dataset.index);
        const selected = suggestions[index].prompt;

        // First show the UI feedback
        (el as HTMLElement).style.background = `linear-gradient(135deg, ${BRAND_COLORS.primaryLight} 0%, ${BRAND_COLORS.white} 100%)`;
        (el as HTMLElement).style.borderColor = BRAND_COLORS.primary;
        (el as HTMLElement).innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${BRAND_COLORS.primary}; display: flex; align-items: center; justify-content: center; color: ${BRAND_COLORS.white}; font-size: 16px; font-weight: 800;">
              ✓
            </div>
            <span style="font-size: 16px; font-weight: 700; color: ${BRAND_COLORS.primary};">
              Applied! Sending metrics...
            </span>
          </div>
        `;

        // Handle the suggestion selection (this will calculate tokens and send API)
        if (editor) {
          handleSuggestionSelection(selected, editor);
        }

        // Close popup after showing feedback
        setTimeout(() => {
          if (gaiaPopup) {
            gaiaPopup.style.opacity = "0";
            gaiaPopup.style.transform = "translateY(12px) scale(0.95)";
          }
          setTimeout(() => {
            gaiaPopup?.remove();
            gaiaPopup = null;
          }, 200);
        }, 800);
      });
    });
  });
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    "Clarity": "🎯",
    "Specificity": "🔍",
    "Context": "📚",
    "Structure": "🏗️",
    "Examples": "💡",
    "Constraints": "⚖️",
    "Format": "📝",
    "Tone": "🎨",
    "default": "✨"
  };
  
  return icons[type] || icons.default;
}

// ==================== POSITIONING ====================

function repositionIcon(): void {
  if (!gaiaIcon) return;

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();
  gaiaIcon.style.bottom = `${window.innerHeight - rect.bottom + 12}px`;
  gaiaIcon.style.right = `${window.innerWidth - rect.right + 12}px`;
}

function repositionPopup(): void {
  if (!gaiaPopup) return;

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();
  gaiaPopup.style.bottom = `${window.innerHeight - rect.bottom + 72}px`;
  gaiaPopup.style.right = `${window.innerWidth - rect.right + 12}px`;
}

// ==================== INITIALIZATION ====================

async function initialize(): Promise<void> {
  try {
    console.log("🚀 Initializing GAIA v3.3...");

    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      console.warn("⚠️ Not logged in - Extension will still track metrics locally");
      // Continue initialization even without auth
      // Metrics will be stored locally and retried when auth is available
    } else {
      console.log("✅ Authenticated - Full functionality enabled");
    }

    injectStyles();

    window.addEventListener("scroll", repositionIcon, { passive: true });
    window.addEventListener("scroll", repositionPopup, { passive: true });
    window.addEventListener("resize", () => {
      repositionIcon();
      repositionPopup();
    });

    const observer = new MutationObserver(() => {
      const editor = getEditor();
      
      if (!editor) {
        gaiaIcon?.remove();
        gaiaIcon = null;
        gaiaPopup?.remove();
        gaiaPopup = null;
        listenersAttached = false;
      } else {
        injectGaiaIcon();
        repositionIcon();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Multiple injection attempts for reliability
    [1000, 2000, 3000, 5000].forEach(delay => {
      setTimeout(() => injectGaiaIcon(), delay);
    });

    console.log("🎉 GAIA ready! Monitoring for submissions...");

  } catch (error) {
    console.error("❌ Initialization failed:", error);
  }
}

// Start the extension
initialize();