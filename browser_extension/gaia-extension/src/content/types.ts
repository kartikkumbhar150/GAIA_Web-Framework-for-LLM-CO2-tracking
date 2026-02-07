// Type definitions for GAIA Extension

export interface PromptSuggestion {
  type: string;
  prompt: string;
}

export interface ModelRecommendation {
  name: string;
  icon: string;
  description: string;
  bestFor: string[];
  color: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  icon: string;
  tasks: string[];
}

export interface StorageData {
  selectedModel?: string;
  preferences?: {
    autoAnalyze?: boolean;
    showInPage?: boolean;
  };
}

declare global {
  interface Window {
    gaiaExtension?: {
      icon: HTMLDivElement | null;
      popup: HTMLDivElement | null;
    };
  }
}
