import { analyzeRealtime } from "../realtime/analyzer";
import type { PromptSuggestion } from "../nlp/types";
// @ts-ignore - gpt-tokenizer is a valid package
import { encode } from "gpt-tokenizer";

console.log("🚀 GAIA Assistant v5.0 - Full Automatic Mode - Enterprise Zero-Log Architecture");

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
  submission_type?: "direct" | "suggestion";
}

interface StorageResult {
  failedMetrics?: Metrics[];
}

interface AuthResponse {
  token?: string;
}

interface TokenEstimate {
  tokens: number;
  method: "accurate" | "heuristic";
  confidence: number;
}

interface PromptAnalysis {
  hasWordCount: boolean;
  wordCount: number;
  hasLengthConstraint: boolean;
  constraintType?: "words" | "characters" | "sentences" | "paragraphs";
  estimatedOutputTokens: number;
  promptComplexity: "simple" | "moderate" | "complex";
}

interface LLMDetectionResult {
  site: string;
  model: string;
  cloudProvider: string;
  cloudRegion: string;
  confidence: number;
}

// ==================== CONFIGURATION ====================

const CONFIG = {
  TYPING_DELAY: 300,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  API_TIMEOUT: 10000,
  MAX_FAILED_METRICS: 100,
  SUBMISSION_DEBOUNCE: 500,
  TOKEN_SAFETY_MARGIN: 1.05,
  MODEL_DETECTION_INTERVAL: 3000,
  PROMPT_DETECTION_INTERVAL: 300, // Faster polling for better detection
} as const;

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
} as const;

// ==================== LLM PLATFORM CONFIGURATIONS ====================

interface PlatformConfig {
  name: string;
  models: string[];
  defaultModel: string;
  cloudProvider: string;
  regions: string[];
  defaultRegion: string;
  detectionSelectors: {
    model?: string[];
    editor?: string[];
    submit?: string[];
  };
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  "chatgpt": {
    name: "ChatGPT",
    models: ["gpt-5.2","gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-3.5-turbo", "o1-preview", "o1-mini"],
    defaultModel: "gpt-5.2",
    cloudProvider: "Azure",
    regions: ["us-east", "us-west", "eu-west"],
    defaultRegion: "us-east",
    detectionSelectors: {
      model: [
        '[data-testid="model-switcher"]',
        '.model-selector',
        '[class*="model-name"]',
        'button[aria-label*="model" i]'
      ],
      editor: [
        '#prompt-textarea',
        'textarea[placeholder*="message" i]',
        '[contenteditable="true"][role="textbox"]'
      ],
      submit: [
        '[data-testid="send-button"]',
        '[data-testid="fruitjuice-send-button"]',
        'button[aria-label*="send" i]'
      ]
    }
  },
  "claude": {
    name: "Claude",
    models: ["claude-opus-4", "claude-sonnet-4", "claude-sonnet-3.5", "claude-haiku-3.5"],
    defaultModel: "claude-sonnet-4",
    cloudProvider: "AWS",
    regions: ["us-east-1", "us-west-2", "eu-west-1"],
    defaultRegion: "us-east-1",
    detectionSelectors: {
      model: [
        '[data-testid="model-selector"]',
        'button[aria-label*="model" i]',
        '[class*="model"]'
      ],
      editor: [
        '.ProseMirror',
        '[contenteditable="true"]',
        'div[role="textbox"]'
      ],
      submit: [
        'button[aria-label*="send" i]',
        '[data-testid="send-button"]'
      ]
    }
  },
  "gemini": {
    name: "Gemini",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    defaultModel: "gemini-2.0-flash",
    cloudProvider: "GCP",
    regions: ["us-central1", "europe-west1", "asia-south1"],
    defaultRegion: "us-central1",
    detectionSelectors: {
      model: [
        '[aria-label*="model" i]',
        'button[class*="model"]'
      ],
      editor: [
        'textarea[aria-label*="prompt" i]',
        '[contenteditable="true"]'
      ],
      submit: [
        'button[aria-label*="send" i]'
      ]
    }
  },
  "copilot": {
    name: "Copilot",
    models: ["gpt-4-turbo", "gpt-4"],
    defaultModel: "gpt-4-turbo",
    cloudProvider: "Azure",
    regions: ["us-east", "eu-west"],
    defaultRegion: "us-east",
    detectionSelectors: {
      editor: [
        'textarea[class*="input"]',
        '[contenteditable="true"]'
      ],
      submit: [
        'button[aria-label*="send" i]',
        'button[type="submit"]'
      ]
    }
  },
  "perplexity": {
    name: "Perplexity",
    models: ["perplexity-pro", "perplexity-standard"],
    defaultModel: "perplexity-pro",
    cloudProvider: "AWS",
    regions: ["us-east-1"],
    defaultRegion: "us-east-1",
    detectionSelectors: {
      editor: [
        'textarea',
        '[contenteditable="true"]'
      ],
      submit: [
        'button[aria-label*="search" i]',
        'button[type="submit"]'
      ]
    }
  }
};

// ==================== STATE MANAGEMENT ====================

class StateManager {
  private gaiaIcon: HTMLDivElement | null = null;
  private gaiaPopup: HTMLDivElement | null = null;
  private inputTokensBefore = 0;
  private inputTokensAfter = 0;
  private outputTokens = 0;
  private currentPromptText = "";
  private lastSubmittedPrompt = "";
  private lastSubmittedHash = "";
  private selectedPromptText = "";
  private isProcessingSubmission = false;
  private submissionDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSubmissionTime = 0;
  private readonly sessionId: string;
  private readonly startTime: number;
  private listenersAttached = false;
  private mutationObserver: MutationObserver | null = null;
  private promptMonitorInterval: ReturnType<typeof setInterval> | null = null;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private detectedPlatform: string = "";
  private detectedModel: string = "";

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = Date.now();
  }

  getTypingTimer(): ReturnType<typeof setTimeout> | null { return this.typingTimer; }
  getIcon(): HTMLDivElement | null { return this.gaiaIcon; }
  getPopup(): HTMLDivElement | null { return this.gaiaPopup; }
  getInputTokensBefore(): number { return this.inputTokensBefore; }
  getInputTokensAfter(): number { return this.inputTokensAfter; }
  getOutputTokens(): number { return this.outputTokens; }
  getCurrentPromptText(): string { return this.currentPromptText; }
  getSelectedPromptText(): string { return this.selectedPromptText; }
  getSessionId(): string { return this.sessionId; }
  getSessionDuration(): number { return Date.now() - this.startTime; }
  areListenersAttached(): boolean { return this.listenersAttached; }
  isSubmissionInProgress(): boolean { return this.isProcessingSubmission; }
  getLastSubmittedPrompt(): string { return this.lastSubmittedPrompt; }
  getLastSubmittedHash(): string { return this.lastSubmittedHash; }
  getDetectedPlatform(): string { return this.detectedPlatform; }
  getDetectedModel(): string { return this.detectedModel; }
  getPromptMonitorInterval(): ReturnType<typeof setInterval> | null { return this.promptMonitorInterval; }

  setIcon(icon: HTMLDivElement | null): void { this.gaiaIcon = icon; }
  setPopup(popup: HTMLDivElement | null): void { this.gaiaPopup = popup; }
  setInputTokensBefore(tokens: number): void { this.inputTokensBefore = tokens; }
  setInputTokensAfter(tokens: number): void { this.inputTokensAfter = tokens; }
  setOutputTokens(tokens: number): void { this.outputTokens = tokens; }
  setCurrentPromptText(text: string): void { this.currentPromptText = text; }
  setSelectedPromptText(text: string): void { this.selectedPromptText = text; }
  setListenersAttached(attached: boolean): void { this.listenersAttached = attached; }
  setMutationObserver(observer: MutationObserver | null): void { this.mutationObserver = observer; }
  setTypingTimer(timer: ReturnType<typeof setTimeout> | null): void { this.typingTimer = timer; }
  setSubmissionInProgress(inProgress: boolean): void { this.isProcessingSubmission = inProgress; }
  setLastSubmittedPrompt(prompt: string): void { this.lastSubmittedPrompt = prompt; }
  setLastSubmittedHash(hash: string): void { this.lastSubmittedHash = hash; }
  setDetectedPlatform(platform: string): void { this.detectedPlatform = platform; }
  setDetectedModel(model: string): void { this.detectedModel = model; }
  setPromptMonitorInterval(interval: ReturnType<typeof setInterval> | null): void { this.promptMonitorInterval = interval; }

  shouldSubmitMetrics(promptText: string): boolean {
    if (!promptText || promptText.trim().length === 0) {
      return false;
    }

    if (this.isProcessingSubmission) {
      console.log("⚠️ Submission already in progress, skipping");
      return false;
    }

    const promptHash = this.hashPrompt(promptText);
    const timeSinceLastSubmission = Date.now() - this.lastSubmissionTime;
    
    if (promptHash === this.lastSubmittedHash && timeSinceLastSubmission < 3000) {
      console.log("⚠️ Duplicate submission detected (hash match), skipping");
      return false;
    }

    return true;
  }

  hashPrompt(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  markSubmissionComplete(promptText: string): void {
    this.lastSubmittedPrompt = promptText;
    this.lastSubmittedHash = this.hashPrompt(promptText);
    this.lastSubmissionTime = Date.now();
    this.isProcessingSubmission = false;
  }

  resetSubmissionState(): void {
    this.currentPromptText = "";
    this.selectedPromptText = "";
    this.inputTokensBefore = 0;
    this.inputTokensAfter = 0;
    this.outputTokens = 0;
    this.isProcessingSubmission = false;
  }

  scheduleSubmission(callback: () => void, delay: number = CONFIG.SUBMISSION_DEBOUNCE): void {
    if (this.submissionDebounceTimer) {
      clearTimeout(this.submissionDebounceTimer);
    }

    this.submissionDebounceTimer = setTimeout(() => {
      callback();
      this.submissionDebounceTimer = null;
    }, delay);
  }

  clearSubmissionTimer(): void {
    if (this.submissionDebounceTimer) {
      clearTimeout(this.submissionDebounceTimer);
      this.submissionDebounceTimer = null;
    }
  }

  cleanup(): void {
    if (this.typingTimer) clearTimeout(this.typingTimer);
    if (this.submissionDebounceTimer) clearTimeout(this.submissionDebounceTimer);
    if (this.promptMonitorInterval) clearInterval(this.promptMonitorInterval);
    if (this.mutationObserver) this.mutationObserver.disconnect();
    if (this.gaiaIcon) this.gaiaIcon.remove();
    if (this.gaiaPopup) this.gaiaPopup.remove();
  }
}

const state = new StateManager();

// ==================== ADVANCED LLM DETECTION ====================

class LLMDetector {
  private static instance: LLMDetector;
  private detectionResult: LLMDetectionResult;
  private lastDetectionTime = 0;
  private detectionInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.detectionResult = this.performDetection();
  }

  static getInstance(): LLMDetector {
    if (!LLMDetector.instance) {
      LLMDetector.instance = new LLMDetector();
    }
    return LLMDetector.instance;
  }

  private performDetection(): LLMDetectionResult {
    const hostname = window.location.hostname.toLowerCase();

    let platformKey = "";
    let platformConfig: PlatformConfig | null = null;

    if (hostname.includes("chat.openai.com") || hostname.includes("chatgpt.com")) {
      platformKey = "chatgpt";
    } else if (hostname.includes("claude.ai")) {
      platformKey = "claude";
    } else if (hostname.includes("gemini.google.com")) {
      platformKey = "gemini";
    } else if (hostname.includes("copilot.microsoft.com") || hostname.includes("bing.com/chat")) {
      platformKey = "copilot";
    } else if (hostname.includes("perplexity.ai")) {
      platformKey = "perplexity";
    }

    if (platformKey && PLATFORM_CONFIGS[platformKey]) {
      platformConfig = PLATFORM_CONFIGS[platformKey];
    }

    if (!platformConfig) {
      console.warn("⚠️ Unknown platform, using generic detection");
      return {
        site: "Unknown",
        model: "unknown",
        cloudProvider: "unknown",
        cloudRegion: "unknown",
        confidence: 0.3
      };
    }

    const model = this.detectModel(platformConfig);
    const region = this.detectRegion(platformConfig);

    const result: LLMDetectionResult = {
      site: platformConfig.name,
      model: model,
      cloudProvider: platformConfig.cloudProvider,
      cloudRegion: region,
      confidence: 0.85
    };

    console.log("🔍 LLM Detection Result:", result);
    return result;
  }

  private detectModel(config: PlatformConfig): string {
    if (!config.detectionSelectors.model) {
      return config.defaultModel;
    }

    for (const selector of config.detectionSelectors.model) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        const text = element.textContent?.toLowerCase() || "";
        const ariaLabel = element.getAttribute("aria-label")?.toLowerCase() || "";
        const title = element.getAttribute("title")?.toLowerCase() || "";
        
        const searchText = `${text} ${ariaLabel} ${title}`;

        for (const model of config.models) {
          const modelLower = model.toLowerCase();
          const modelShort = modelLower.replace(/[.-]/g, "");
          
          if (searchText.includes(modelLower) || 
              searchText.includes(modelShort) ||
              searchText.includes(model)) {
            console.log(`✅ Model detected from UI: ${model}`);
            return model;
          }
        }
      }
    }

    const url = window.location.href.toLowerCase();
    for (const model of config.models) {
      if (url.includes(model.toLowerCase().replace(/[.-]/g, ""))) {
        console.log(`✅ Model detected from URL: ${model}`);
        return model;
      }
    }

    try {
      const storage = localStorage.getItem("selectedModel") || 
                     localStorage.getItem("model") ||
                     localStorage.getItem("currentModel");
      
      if (storage) {
        const storageText = storage.toLowerCase();
        for (const model of config.models) {
          if (storageText.includes(model.toLowerCase())) {
            console.log(`✅ Model detected from storage: ${model}`);
            return model;
          }
        }
      }
    } catch (e) {
      // localStorage might be restricted
    }

    console.log(`ℹ️ Using default model: ${config.defaultModel}`);
    return config.defaultModel;
  }

  private detectRegion(config: PlatformConfig): string {
    const hostname = window.location.hostname;
    for (const region of config.regions) {
      if (hostname.includes(region)) {
        return region;
      }
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (timezone.includes("America")) {
        const usRegions = config.regions.filter(r => r.includes("us"));
        if (usRegions.length > 0) return usRegions[0];
      } else if (timezone.includes("Europe")) {
        const euRegions = config.regions.filter(r => r.includes("eu"));
        if (euRegions.length > 0) return euRegions[0];
      } else if (timezone.includes("Asia")) {
        const asiaRegions = config.regions.filter(r => r.includes("asia") || r.includes("ap"));
        if (asiaRegions.length > 0) return asiaRegions[0];
      }
    } catch (e) {
      // Timezone detection failed
    }

    return config.defaultRegion;
  }

  getDetectionResult(): LLMDetectionResult {
    const now = Date.now();
    if (now - this.lastDetectionTime > 5000) {
      this.detectionResult = this.performDetection();
      this.lastDetectionTime = now;
    }
    
    return this.detectionResult;
  }

  startContinuousDetection(): void {
    if (this.detectionInterval) {
      return;
    }

    console.log("🔄 Starting continuous model detection...");
    
    this.detectionInterval = setInterval(() => {
      const oldResult = this.detectionResult;
      const newResult = this.performDetection();
      
      if (oldResult.model !== newResult.model || oldResult.site !== newResult.site) {
        console.log(`🔄 Detection changed: ${oldResult.site}/${oldResult.model} → ${newResult.site}/${newResult.model}`);
        this.detectionResult = newResult;
        this.lastDetectionTime = Date.now();
        
        state.setDetectedPlatform(newResult.site);
        state.setDetectedModel(newResult.model);
      }
    }, CONFIG.MODEL_DETECTION_INTERVAL);
  }

  stopContinuousDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }
}

const llmDetector = LLMDetector.getInstance();

// ==================== ACCURATE TOKEN COUNTING ====================

class TokenCounter {
  static getAccurateTokens(text: string): TokenEstimate {
    if (!text || text.trim().length === 0) {
      return { tokens: 0, method: "accurate", confidence: 1.0 };
    }

    try {
      const encoded = encode(text);
      const tokens = encoded.length;
      const adjustedTokens = Math.ceil(tokens * CONFIG.TOKEN_SAFETY_MARGIN);
      
      return {
        tokens: adjustedTokens,
        method: "accurate",
        confidence: 0.98
      };
    } catch (error) {
      console.warn("⚠️ gpt-tokenizer failed, falling back to heuristic:", error);
      return this.getHeuristicTokens(text);
    }
  }

  private static getHeuristicTokens(text: string): TokenEstimate {
    if (!text || text.trim().length === 0) {
      return { tokens: 0, method: "heuristic", confidence: 0 };
    }

    const charCount = text.length;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    const charEstimate = Math.ceil(charCount / 4);
    const wordEstimate = Math.ceil(wordCount * 1.3);
    
    let tokenCount = Math.max(charEstimate, wordEstimate);
    
    const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
    const inlineCode = (text.match(/`[^`]+`/g) || []).length;
    const urls = (text.match(/https?:\/\/[^\s]+/g) || []).length;
    
    tokenCount += codeBlocks * 50;
    tokenCount += inlineCode * 3;
    tokenCount += urls * 4;
    
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (wordCount || 1);
    if (avgWordLength > 8) {
      tokenCount = Math.ceil(tokenCount * 1.2);
    }
    
    tokenCount = Math.ceil(tokenCount * CONFIG.TOKEN_SAFETY_MARGIN);
    
    return {
      tokens: Math.max(tokenCount, 1),
      method: "heuristic",
      confidence: 0.75
    };
  }

  static count(text: string): number {
    const result = this.getAccurateTokens(text);
    return result.tokens;
  }
}

// ==================== PROMPT ANALYSIS ====================

class PromptAnalyzer {
  static analyze(text: string): PromptAnalysis {
    if (!text || text.trim().length === 0) {
      return {
        hasWordCount: false,
        wordCount: 0,
        hasLengthConstraint: false,
        estimatedOutputTokens: 0,
        promptComplexity: "simple"
      };
    }

    const analysis: PromptAnalysis = {
      hasWordCount: false,
      wordCount: 0,
      hasLengthConstraint: false,
      estimatedOutputTokens: 0,
      promptComplexity: this.assessComplexity(text)
    };

    const wordCountResult = this.extractWordCount(text);
    if (wordCountResult.found) {
      analysis.hasWordCount = true;
      analysis.wordCount = wordCountResult.count;
      analysis.hasLengthConstraint = true;
      analysis.constraintType = "words";
      analysis.estimatedOutputTokens = Math.ceil(wordCountResult.count * 1.3);
    }

    const constraintResult = this.extractLengthConstraints(text);
    if (constraintResult.found && !analysis.hasWordCount) {
      analysis.hasLengthConstraint = true;
      analysis.constraintType = constraintResult.type;
      analysis.estimatedOutputTokens = constraintResult.estimatedTokens;
    }

    if (!analysis.hasLengthConstraint) {
      analysis.estimatedOutputTokens = this.estimateImplicitOutputLength(text, analysis.promptComplexity);
    }

    return analysis;
  }

  private static extractWordCount(text: string): { found: boolean; count: number } {
    const endPatterns = [
      /(?:in|within|using|approximately|about|around)?\s*(\d+)\s*(?:words?|word\s+limit)\.?\s*$/i,
      /(?:write|respond|answer|explain)\s+in\s+(?:approximately|about|around)?\s*(\d+)\s*words?\.?\s*$/i,
      /(?:limit|max|maximum)\s*:?\s*(\d+)\s*words?\.?\s*$/i,
    ];

    for (const pattern of endPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const count = parseInt(match[1], 10);
        if (count > 0 && count <= 100000) {
          return { found: true, count };
        }
      }
    }

    const middlePatterns = [
      /\b(\d+)\s*(?:word|words)\b/i,
      /\bin\s+(\d+)\s+(?:word|words)\b/i,
      /\bwithin\s+(\d+)\s+(?:word|words)\b/i,
    ];

    for (const pattern of middlePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const count = parseInt(match[1], 10);
        if (count > 0 && count <= 100000) {
          return { found: true, count };
        }
      }
    }

    return { found: false, count: 0 };
  }

  private static extractLengthConstraints(text: string): {
    found: boolean;
    type?: "characters" | "sentences" | "paragraphs";
    estimatedTokens: number;
  } {
    const charMatch = text.match(/(\d+)\s*(?:characters?|chars?)\b/i);
    if (charMatch && charMatch[1]) {
      const chars = parseInt(charMatch[1], 10);
      if (chars > 0 && chars <= 1000000) {
        const tokens = Math.ceil(chars / 4);
        return { found: true, type: "characters", estimatedTokens: tokens };
      }
    }

    const sentenceMatch = text.match(/(\d+)\s*(?:sentences?)\b/i);
    if (sentenceMatch && sentenceMatch[1]) {
      const sentences = parseInt(sentenceMatch[1], 10);
      if (sentences > 0 && sentences <= 1000) {
        const tokens = Math.ceil(sentences * 20);
        return { found: true, type: "sentences", estimatedTokens: tokens };
      }
    }

    const paragraphMatch = text.match(/(\d+)\s*(?:paragraphs?)\b/i);
    if (paragraphMatch && paragraphMatch[1]) {
      const paragraphs = parseInt(paragraphMatch[1], 10);
      if (paragraphs > 0 && paragraphs <= 100) {
        const tokens = Math.ceil(paragraphs * 100);
        return { found: true, type: "paragraphs", estimatedTokens: tokens };
      }
    }

    return { found: false, estimatedTokens: 0 };
  }

  private static assessComplexity(text: string): "simple" | "moderate" | "complex" {
    const length = text.length;
    const wordCount = text.split(/\s+/).length;
    
    const hasCode = /```[\s\S]*?```/.test(text) || /`[^`]+`/.test(text);
    const hasMultipleQuestions = (text.match(/\?/g) || []).length > 1;
    const hasLists = /[-*•]\s/.test(text) || /\d+\.\s/.test(text);
    const hasInstructions = /(?:first|then|next|finally|step|stage)/i.test(text);
    
    let complexityScore = 0;
    
    if (length > 500) complexityScore += 2;
    else if (length > 200) complexityScore += 1;
    
    if (wordCount > 100) complexityScore += 2;
    else if (wordCount > 50) complexityScore += 1;
    
    if (hasCode) complexityScore += 2;
    if (hasMultipleQuestions) complexityScore += 1;
    if (hasLists) complexityScore += 1;
    if (hasInstructions) complexityScore += 1;
    
    if (complexityScore >= 5) return "complex";
    if (complexityScore >= 2) return "moderate";
    return "simple";
  }

  private static estimateImplicitOutputLength(text: string, complexity: string): number {
    const inputTokens = TokenCounter.count(text);
    
    let multiplier = 3;
    
    if (/(?:explain|describe|elaborate|detail|analyze)/i.test(text)) {
      multiplier = 5;
    } else if (/(?:summarize|brief|short|concise)/i.test(text)) {
      multiplier = 1.5;
    } else if (/(?:list|enumerate)/i.test(text)) {
      multiplier = 2;
    } else if (/(?:code|program|script|function)/i.test(text)) {
      multiplier = 4;
    }
    
    if (complexity === "complex") {
      multiplier *= 1.5;
    } else if (complexity === "simple") {
      multiplier *= 0.7;
    }
    
    const estimatedOutput = Math.ceil(inputTokens * multiplier);
    const cappedOutput = Math.min(estimatedOutput, 10000);
    
    return cappedOutput;
  }
}

// ==================== DOM UTILITIES ====================

class DOMUtils {
  static getEditor(): HTMLElement | null {
    const detection = llmDetector.getDetectionResult();
    const platformKey = detection.site.toLowerCase().replace(/\s+/g, "");
    const config = PLATFORM_CONFIGS[platformKey];

    if (config?.detectionSelectors.editor) {
      for (const selector of config.detectionSelectors.editor) {
        const editor = document.querySelector<HTMLElement>(selector);
        if (editor && this.isVisible(editor)) {
          return editor;
        }
      }
    }

    const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea"));
    const validTextarea = textareas.find(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 100 && rect.height > 30 && this.isVisible(el);
    });
    if (validTextarea) return validTextarea;

    const editables = Array.from(
      document.querySelectorAll<HTMLElement>('[contenteditable="true"]')
    );
    const validEditable = editables.find(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 200 && rect.height > 30 && this.isVisible(el);
    });
    if (validEditable) return validEditable;

    return null;
  }

  private static isVisible(element: HTMLElement): boolean {
    return !!(
      element.offsetParent !== null &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  static getEditorText(editor: HTMLElement): string {
    if (editor.tagName === "TEXTAREA") {
      return (editor as HTMLTextAreaElement).value || "";
    }
    return editor.innerText || editor.textContent || "";
  }

  static setEditorText(editor: HTMLElement, text: string): void {
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

  static getSubmitButton(): HTMLButtonElement | null {
    const detection = llmDetector.getDetectionResult();
    const platformKey = detection.site.toLowerCase().replace(/\s+/g, "");
    const config = PLATFORM_CONFIGS[platformKey];

    if (config?.detectionSelectors.submit) {
      for (const selector of config.detectionSelectors.submit) {
        const button = document.querySelector<HTMLButtonElement>(selector);
        if (button && this.isVisible(button)) {
          return button;
        }
      }
    }

    const selectors = [
      'button[aria-label*="Send" i]',
      'button[aria-label*="submit" i]',
      'button[type="submit"]',
      '.send-button',
    ];

    for (const selector of selectors) {
      const button = document.querySelector<HTMLButtonElement>(selector);
      if (button && this.isVisible(button)) {
        return button;
      }
    }

    return null;
  }
}

// ==================== EVENT HANDLERS ====================

class EventHandler {
  static handleTyping(editor: HTMLElement): void {
    if (state.getTypingTimer()) {
      clearTimeout(state.getTypingTimer()!);
    }

    const timer = setTimeout(() => {
      const text = DOMUtils.getEditorText(editor);
      state.setCurrentPromptText(text);
      
      const tokens = TokenCounter.count(text);
      state.setInputTokensBefore(tokens);
      
      console.log(`⌨️ Typing: ${tokens} tokens`);
    }, CONFIG.TYPING_DELAY);

    state.setTypingTimer(timer);
  }

  static handleSubmit(editor: HTMLElement): void {
    console.log(`\n📤 SUBMIT DETECTED`);
    
    state.scheduleSubmission(() => {
      this.processSubmission(editor);
    });
  }

  private static processSubmission(editor: HTMLElement): void {
    const text = DOMUtils.getEditorText(editor) || state.getCurrentPromptText();

    if (!text || text.trim().length === 0) {
      const stateText = state.getCurrentPromptText();
      if (stateText && stateText.trim().length > 0) {
        console.log("⚠️ Editor empty but state has text, using state text");
        return this.sendMetricsForPrompt(stateText, false);
      }
      console.log("⏭️ No valid prompt text found, skipping");
      return;
    }

    if (!state.shouldSubmitMetrics(text)) {
      return;
    }

    this.sendMetricsForPrompt(text, false);
  }

  private static sendMetricsForPrompt(text: string, isSuggestion: boolean): void {
    state.setSubmissionInProgress(true);

    const submissionType = isSuggestion ? "suggestion" : "direct";

    console.log(`\n📊 ${submissionType.toUpperCase()} SUBMISSION:`);
    console.log(`   ├─ Prompt: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    
    const inputTokensBefore = state.getInputTokensBefore() || TokenCounter.count(text);
    const inputTokensAfter = TokenCounter.count(text);
    
    const analysis = PromptAnalyzer.analyze(text);
    const outputTokens = analysis.estimatedOutputTokens;
    
    const totalTokens = inputTokensAfter + outputTokens;

    const detection = llmDetector.getDetectionResult();

    console.log(`   ├─ Input (raw):    ${inputTokensBefore} tokens`);
    console.log(`   ├─ Input (final):  ${inputTokensAfter} tokens`);
    console.log(`   ├─ Output (est):   ${outputTokens} tokens`);
    console.log(`   ├─ Total:          ${totalTokens} tokens`);
    console.log(`   ├─ Platform:       ${detection.site}`);
    console.log(`   ├─ Model:          ${detection.model}`);
    console.log(`   ├─ Cloud:          ${detection.cloudProvider} (${detection.cloudRegion})`);
    console.log(`   └─ Session:        ${state.getSessionId()}\n`);

    state.setInputTokensBefore(inputTokensBefore);
    state.setInputTokensAfter(inputTokensAfter);
    state.setOutputTokens(outputTokens);

    MetricsAPI.sendMetrics(submissionType)
      .then(() => {
        console.log("✅ Metrics sent successfully");
        state.markSubmissionComplete(text);
      })
      .catch((error) => {
        console.error("❌ Failed to send metrics:", error);
        state.markSubmissionComplete(text);
      })
      .finally(() => {
        setTimeout(() => {
          state.resetSubmissionState();
        }, 1000);
      });
  }

  static handleSuggestionSelection(suggestionText: string, editor: HTMLElement): void {
    console.log(`\n🎯 SUGGESTION SELECTED:`);
    
    state.setSelectedPromptText(suggestionText);
    
    const inputTokensBefore = state.getInputTokensBefore();
    const inputTokensAfter = TokenCounter.count(suggestionText);
    
    const analysis = PromptAnalyzer.analyze(suggestionText);
    const outputTokens = analysis.estimatedOutputTokens;
    
    const totalTokens = inputTokensAfter + outputTokens;

    const detection = llmDetector.getDetectionResult();

    console.log(`   ├─ Original: "${state.getCurrentPromptText().substring(0, 50)}..."`);
    console.log(`   ├─ Selected: "${suggestionText.substring(0, 50)}..."`);
    console.log(`   ├─ Input (before): ${inputTokensBefore} tokens`);
    console.log(`   ├─ Input (after):  ${inputTokensAfter} tokens`);
    console.log(`   ├─ Output (est):   ${outputTokens} tokens`);
    console.log(`   ├─ Total:          ${totalTokens} tokens`);
    console.log(`   └─ Platform:       ${detection.site}/${detection.model}\n`);

    state.setInputTokensAfter(inputTokensAfter);
    state.setOutputTokens(outputTokens);
    state.setCurrentPromptText(suggestionText);

    DOMUtils.setEditorText(editor, suggestionText);

    this.sendMetricsForPrompt(suggestionText, true);
  }
}

// ==================== METRICS API ====================

class MetricsAPI {
  static async sendMetrics(submissionType: "direct" | "suggestion"): Promise<void> {
    try {
      const metrics = this.createMetricsObject(submissionType);

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
      await this.storeFailedMetrics(this.createMetricsObject(submissionType));
    }
  }

  private static createMetricsObject(submissionType: "direct" | "suggestion"): Metrics {
    const detection = llmDetector.getDetectionResult();
    
    return {
      site: detection.site,
      model: detection.model,
      input_tokens_before: state.getInputTokensBefore() || 0,
      input_tokens_after: state.getInputTokensAfter() || 0,
      output_tokens: state.getOutputTokens() || 0,
      total_tokens: (state.getInputTokensAfter() || 0) + (state.getOutputTokens() || 0),
      timestamp: Date.now(),
      session_id: state.getSessionId(),
      is_cached: false,
      cloud_provider: detection.cloudProvider,
      cloud_region: detection.cloudRegion,
      submission_type: submissionType
    };
  }

  private static async storeFailedMetrics(metrics: Metrics): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["failedMetrics"]) as StorageResult;
      const existing: Metrics[] = result.failedMetrics || [];
      existing.push(metrics);
      
      const trimmed = existing.slice(-CONFIG.MAX_FAILED_METRICS);
      
      await chrome.storage.local.set({ failedMetrics: trimmed });
      console.log(`💾 Stored locally (${trimmed.length} in queue)`);
    } catch (error) {
      console.error("❌ Storage error:", error);
    }
  }
}

// ==================== ENHANCED AUTOMATIC SUBMISSION DETECTION ====================

class EnhancedSubmissionDetector {
  private lastKnownPrompt = "";
  private lastKnownPromptHash = "";
  private submissionCheckInterval: ReturnType<typeof setInterval> | null = null;
  private editorCheckCount = 0;

  startContinuousMonitoring(): void {
    console.log("🔍 Starting ENHANCED continuous submission monitoring...");

    this.submissionCheckInterval = setInterval(() => {
      this.checkForSubmission();
    }, CONFIG.PROMPT_DETECTION_INTERVAL);
  }

  private checkForSubmission(): void {
    const editor = DOMUtils.getEditor();
    
    if (!editor) {
      this.editorCheckCount++;
      if (this.editorCheckCount > 10) {
        this.lastKnownPrompt = "";
        this.lastKnownPromptHash = "";
      }
      return;
    }

    this.editorCheckCount = 0;
    const currentText = DOMUtils.getEditorText(editor);

    if (currentText && currentText.length > 0) {
      state.setCurrentPromptText(currentText);
      const tokens = TokenCounter.count(currentText);
      state.setInputTokensBefore(tokens);
      this.lastKnownPrompt = currentText;
      this.lastKnownPromptHash = state.hashPrompt(currentText);
    }

    // SUBMISSION DETECTED: Editor cleared after having content
    if (this.lastKnownPrompt.length > 5 && currentText.length === 0) {
      console.log("🎯 SUBMISSION DETECTED: Editor cleared!");
      this.processDetectedSubmission(this.lastKnownPrompt);
      this.lastKnownPrompt = "";
      this.lastKnownPromptHash = "";
    }
  }

  private processDetectedSubmission(promptText: string): void {
    if (!state.shouldSubmitMetrics(promptText)) {
      return;
    }

    state.setSubmissionInProgress(true);

    const inputTokensAfter = TokenCounter.count(promptText);
    const analysis = PromptAnalyzer.analyze(promptText);
    const outputTokens = analysis.estimatedOutputTokens;
    const totalTokens = inputTokensAfter + outputTokens;
    const detection = llmDetector.getDetectionResult();

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📤 AUTO-DETECTED SUBMISSION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Metrics:`);
    console.log(`   ├─ Prompt: "${promptText.substring(0, 80)}..."`);
    console.log(`   ├─ Input tokens: ${inputTokensAfter}`);
    console.log(`   ├─ Output tokens (est): ${outputTokens}`);
    console.log(`   ├─ Total tokens: ${totalTokens}`);
    console.log(`   ├─ Platform: ${detection.site}`);
    console.log(`   ├─ Model: ${detection.model}`);
    console.log(`   ├─ Cloud: ${detection.cloudProvider} / ${detection.cloudRegion}`);
    console.log(`   └─ Session: ${state.getSessionId()}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    state.setInputTokensAfter(inputTokensAfter);
    state.setOutputTokens(outputTokens);

    MetricsAPI.sendMetrics("direct")
      .then(() => {
        console.log("✅ Metrics sent successfully (AUTO)");
        state.markSubmissionComplete(promptText);
      })
      .catch((error) => {
        console.error("❌ Failed to send metrics:", error);
        state.markSubmissionComplete(promptText);
      })
      .finally(() => {
        setTimeout(() => {
          state.resetSubmissionState();
        }, 1000);
      });
  }

  stopMonitoring(): void {
    if (this.submissionCheckInterval) {
      clearInterval(this.submissionCheckInterval);
      this.submissionCheckInterval = null;
    }
  }
}

const enhancedDetector = new EnhancedSubmissionDetector();

// ==================== BACKUP SUBMISSION DETECTORS ====================

class BackupSubmissionDetectors {
  static setupAllDetectors(): void {
    console.log("🔧 Setting up backup submission detectors...");
    this.interceptNetworkRequests();
    this.monitorResponseAppearance();
  }

  private static interceptNetworkRequests(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      const url = args[0]?.toString() || "";
      const llmPatterns = [
        '/api/conversation',
        '/api/chat',
        '/v1/messages',
        '/api/generate',
        'backend-api',
        'completions',
        'chat/completions'
      ];
      
      if (llmPatterns.some(p => url.includes(p))) {
        console.log("🌐 LLM API call detected:", url);
        
        const currentPrompt = state.getCurrentPromptText();
        if (currentPrompt && currentPrompt.length > 5) {
          setTimeout(() => {
            if (state.shouldSubmitMetrics(currentPrompt)) {
              console.log("📤 Triggering metrics from API detection");
              const editor = DOMUtils.getEditor();
              if (editor) {
                EventHandler.handleSubmit(editor);
              }
            }
          }, 500);
        }
      }
      
      return response;
    };

    console.log("✅ Network request interceptor installed");
  }

  private static monitorResponseAppearance(): void {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const className = element.className || "";
              
              if (className.includes("message") || 
                  className.includes("response") || 
                  className.includes("assistant") ||
                  element.getAttribute("role") === "article") {
                
                console.log("🤖 AI response detected in DOM");
                
                const currentPrompt = state.getCurrentPromptText();
                if (currentPrompt && currentPrompt.length > 5) {
                  setTimeout(() => {
                    if (state.shouldSubmitMetrics(currentPrompt)) {
                      console.log("📤 Triggering metrics from response detection");
                      const editor = DOMUtils.getEditor();
                      if (editor) {
                        EventHandler.handleSubmit(editor);
                      }
                    }
                  }, 500);
                }
                break;
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log("✅ Response appearance monitor installed");
  }
}

// ==================== AUTH ====================

class AuthManager {
  static async isLoggedIn(): Promise<boolean> {
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
}

// ==================== LISTENER ATTACHMENT ====================

class ListenerManager {
  static attachListeners(editor: HTMLElement): void {
    if (state.areListenersAttached()) {
      console.log("ℹ️ Listeners already attached");
      return;
    }

    const handleInput = () => EventHandler.handleTyping(editor);
    editor.addEventListener("input", handleInput);

    const handleKeydown = (e: KeyboardEvent) => {
      const isSubmit = 
        (e.key === "Enter" && !e.shiftKey) || 
        (e.key === "Enter" && (e.ctrlKey || e.metaKey));
      
      if (isSubmit) {
        console.log("⌨️ Enter key detected - triggering submission");
        EventHandler.handleSubmit(editor);
      }
    };
    editor.addEventListener("keydown", handleKeydown);

    this.attachButtonListener();
    this.attachFormListener(editor);

    const buttonCheckInterval = setInterval(() => {
      this.attachButtonListener();
    }, 2000);

    this.monitorConversationChanges();

    window.addEventListener("beforeunload", () => {
      clearInterval(buttonCheckInterval);
      state.cleanup();
    });

    state.setListenersAttached(true);
    console.log("✅ All listeners attached (keyboard, button, form, DOM monitoring)");
  }

  private static attachButtonListener(): void {
    const submitButton = DOMUtils.getSubmitButton();

    if (submitButton && !submitButton.hasAttribute("data-gaia-listener")) {
      submitButton.setAttribute("data-gaia-listener", "true");
      
      submitButton.addEventListener("click", () => {
        console.log("🖱️ Submit button clicked - triggering submission");
        const editor = DOMUtils.getEditor();
        if (editor) {
          EventHandler.handleSubmit(editor);
        }
      });
      
      console.log("✅ Submit button listener attached");
    }
  }

  private static attachFormListener(editor: HTMLElement): void {
    let formElement = editor.closest("form");
    
    if (formElement && !formElement.hasAttribute("data-gaia-listener")) {
      formElement.setAttribute("data-gaia-listener", "true");
      
      formElement.addEventListener("submit", (e) => {
        console.log("📋 Form submission detected - triggering metrics");
        EventHandler.handleSubmit(editor);
      });
      
      console.log("✅ Form submission listener attached");
    }
  }

  private static monitorConversationChanges(): void {
    const conversationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              const isNewMessage = 
                element.matches('[data-message-id]') ||
                element.matches('[class*="message"]') ||
                element.matches('[class*="response"]') ||
                element.matches('[class*="assistant"]') ||
                element.matches('[role="article"]') ||
                element.classList.contains('group');
              
              if (isNewMessage) {
                console.log("🔍 New message/response detected in DOM");
                
                setTimeout(() => {
                  const currentPrompt = state.getCurrentPromptText();
                  if (currentPrompt && currentPrompt.trim().length > 0) {
                    console.log("📤 Auto-submitting from DOM change detection");
                    
                    const editor = DOMUtils.getEditor();
                    if (editor) {
                      const editorText = DOMUtils.getEditorText(editor);
                      if (!editorText || editorText.trim().length === 0) {
                        EventHandler.handleSubmit(editor);
                      }
                    }
                  }
                }, 300);
                
                break;
              }
            }
          }
        }
      }
    });

    conversationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log("✅ DOM conversation change monitoring started");
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
      0%, 100% { box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4); }
      50% { box-shadow: 0 6px 24px rgba(16, 185, 129, 0.6); }
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
  width: 24px;
  height: 24px;
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
  if (state.getIcon()) return;

  const editor = DOMUtils.getEditor();
  if (!editor) return;

  if (!state.areListenersAttached()) {
    ListenerManager.attachListeners(editor);
  }

  const rect = editor.getBoundingClientRect();

  const gaiaIcon = document.createElement("div");
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
  
  state.setIcon(gaiaIcon);
  console.log("✅ Icon injected (OPTIONAL - for manual suggestions only)");
}

// ==================== POPUP UI ====================

function togglePopup(): void {
  const popup = state.getPopup();
  
  if (popup) {
    popup.style.opacity = "0";
    popup.style.transform = "translateY(12px) scale(0.95)";
    
    setTimeout(() => {
      popup?.remove();
      state.setPopup(null);
    }, 200);
    return;
  }

  const editor = DOMUtils.getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();
  const text = state.getCurrentPromptText() || DOMUtils.getEditorText(editor);

  const gaiaPopup = document.createElement("div");
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
  state.setPopup(gaiaPopup);

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
    if (!state.getPopup()) return;

    if (!suggestions || suggestions.length === 0) {
      const inputTokens = state.getInputTokensBefore();
      const analysis = PromptAnalyzer.analyze(text);
      const detection = llmDetector.getDetectionResult();
      
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

          <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primaryLight} 0%, ${BRAND_COLORS.white} 100%); border: 2px solid ${BRAND_COLORS.primary}; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 13px; color: ${BRAND_COLORS.gray700}; font-weight: 600;">Input Tokens</span>
              <span style="font-size: 20px; font-weight: 800; color: ${BRAND_COLORS.primary};">${inputTokens}</span>
            </div>
            <div style="height: 1px; background: ${BRAND_COLORS.primary}; opacity: 0.2; margin: 12px 0;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 13px; color: ${BRAND_COLORS.gray700}; font-weight: 600;">Estimated Output</span>
              <span style="font-size: 20px; font-weight: 800; color: ${BRAND_COLORS.primary};">${analysis.estimatedOutputTokens}</span>
            </div>
            <div style="height: 1px; background: ${BRAND_COLORS.primary}; opacity: 0.2; margin: 12px 0;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; color: ${BRAND_COLORS.gray700}; font-weight: 600;">Complexity</span>
              <span class="gaia-badge" style="background: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.white}; text-transform: capitalize;">${analysis.promptComplexity}</span>
            </div>
          </div>

          <div style="background: ${BRAND_COLORS.gray50}; border-radius: 10px; padding: 14px; border: 1px solid ${BRAND_COLORS.gray200};">
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
              <span style="color: ${BRAND_COLORS.gray600};">Platform: <strong style="color: ${BRAND_COLORS.gray800};">${detection.site}</strong></span>
              <span style="color: ${BRAND_COLORS.gray600};">Model: <strong style="color: ${BRAND_COLORS.gray800};">${detection.model}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <span style="color: ${BRAND_COLORS.gray600};">Cloud: <strong style="color: ${BRAND_COLORS.gray800};">${detection.cloudProvider}</strong></span>
              <span style="color: ${BRAND_COLORS.gray600};">Region: <strong style="color: ${BRAND_COLORS.gray800};">${detection.cloudRegion}</strong></span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const detection = llmDetector.getDetectionResult();

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
            Click to apply • ${detection.site} / ${detection.model}
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
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
            <span style="color: ${BRAND_COLORS.gray600};">Input: <strong style="color: ${BRAND_COLORS.primary};">${state.getInputTokensBefore()}</strong></span>
            <span style="color: ${BRAND_COLORS.gray600};">Cloud: <strong style="color: ${BRAND_COLORS.gray800};">${detection.cloudProvider}</strong></span>
          </div>
          <div style="font-size: 11px; color: ${BRAND_COLORS.gray500}; text-align: center;">
            🔒 Zero-log tracking • All prompts monitored automatically
          </div>
        </div>
      </div>
    `;

    gaiaPopup.querySelectorAll("[data-index]").forEach((el) => {
      el.addEventListener("click", () => {
        const index = Number((el as HTMLElement).dataset.index);
        const selected = suggestions[index].prompt;

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

        if (editor) {
          EventHandler.handleSuggestionSelection(selected, editor);
        }

        setTimeout(() => {
          if (gaiaPopup) {
            gaiaPopup.style.opacity = "0";
            gaiaPopup.style.transform = "translateY(12px) scale(0.95)";
          }
          setTimeout(() => {
            gaiaPopup?.remove();
            state.setPopup(null);
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
  const icon = state.getIcon();
  if (!icon) return;

  const editor = DOMUtils.getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();
  icon.style.bottom = `${window.innerHeight - rect.bottom + 12}px`;
  icon.style.right = `${window.innerWidth - rect.right + 12}px`;
}

function repositionPopup(): void {
  const popup = state.getPopup();
  if (!popup) return;

  const editor = DOMUtils.getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();
  popup.style.bottom = `${window.innerHeight - rect.bottom + 72}px`;
  popup.style.right = `${window.innerWidth - rect.right + 12}px`;
}

// ==================== INITIALIZATION ====================

async function initialize(): Promise<void> {
  try {
    console.log("🚀 Initializing GAIA v5.0 - FULL AUTOMATIC MODE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚡ ALL SUBMISSIONS TRACKED AUTOMATICALLY");
    console.log("🔒 ZERO ICON CLICKS REQUIRED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    const detection = llmDetector.getDetectionResult();
    console.log(`📍 Platform: ${detection.site}`);
    console.log(`🤖 Model: ${detection.model}`);
    console.log(`☁️  Cloud: ${detection.cloudProvider} / ${detection.cloudRegion}`);
    console.log(`📊 Session ID: ${state.getSessionId()}\n`);

    state.setDetectedPlatform(detection.site);
    state.setDetectedModel(detection.model);

    const loggedIn = await AuthManager.isLoggedIn();
    if (!loggedIn) {
      console.warn("⚠️  Not authenticated - metrics will queue locally\n");
    } else {
      console.log("✅ Authenticated - full sync enabled\n");
    }

    injectStyles();

    llmDetector.startContinuousDetection();

    // START ENHANCED AUTOMATIC DETECTION
    enhancedDetector.startContinuousMonitoring();
    BackupSubmissionDetectors.setupAllDetectors();

    window.addEventListener("scroll", repositionIcon, { passive: true });
    window.addEventListener("scroll", repositionPopup, { passive: true });
    window.addEventListener("resize", () => {
      repositionIcon();
      repositionPopup();
    });

    const observer = new MutationObserver(() => {
      const editor = DOMUtils.getEditor();
      
      if (!editor) {
        const icon = state.getIcon();
        const popup = state.getPopup();
        icon?.remove();
        popup?.remove();
        state.setIcon(null);
        state.setPopup(null);
        state.setListenersAttached(false);
      } else {
        injectGaiaIcon();
        repositionIcon();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    state.setMutationObserver(observer);

    [500, 1000, 2000, 3000, 5000].forEach(delay => {
      setTimeout(() => injectGaiaIcon(), delay);
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 GAIA v5.0 - FULLY AUTOMATIC MODE ACTIVE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Detection Methods:");
    console.log("   ├─ Editor clearing detection (300ms polling) ⚡");
    console.log("   ├─ Network request interception 🌐");
    console.log("   ├─ AI response appearance monitoring 🤖");
    console.log("   ├─ Enter key detection ⌨️");
    console.log("   ├─ Submit button clicks 🖱️");
    console.log("   ├─ Form submissions 📋");
    console.log("   └─ DOM change monitoring 🔍");
    console.log("");
    console.log("🔔 Status: MONITORING - Metrics sent AUTOMATICALLY");
    console.log("💡 Icon: Optional (for manual suggestions only)");
    console.log("🔒 Privacy: NO PROMPT TEXT LOGGED - Zero-log architecture");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Initialization failed:", error);
  }
}

// ==================== START ====================

initialize();

// Export for testing
if (typeof window !== "undefined") {
  (window as any).GAIA = {
    state,
    TokenCounter,
    PromptAnalyzer,
    llmDetector,
    enhancedDetector,
    version: "5.0.0-full-auto"
  };
}