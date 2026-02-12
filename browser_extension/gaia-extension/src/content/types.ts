// ==================== CORE TYPES ====================

export interface ModelRecommendation {
  name: string;
  platform: string;
  icon: string;
  description: string;
  bestFor: string[];
  color: string;
  tier: 'flagship' | 'premium' | 'specialized' | 'efficient' | 'value' | 'open-source' | 'enterprise';
  pricing: string;
  contextWindow?: string;
  features?: string[];
  strengths: string[];
  limitations: string[];
  useCase: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  icon: string;
  tasks: string[];
  recommendedModels: {
    llm?: string[];
    image?: string[];
    video?: string[];
    audio?: string[];
  };
}

export interface Platform {
  name: string;
  website: string;
  apiDocs: string;
  logo: string;
  color: string;
  description: string;
}
export type Tier = ModelRecommendation['tier'];


export interface PlatformFeatures {
  hasAPI: boolean;
  hasFreeplan: boolean;
  hasEnterprise: boolean;
  multimodal: boolean;
}

export interface PromptSuggestion {
  type: "Clarity" | "Specificity" | "Context" | "Example" | "Constraint";
  prompt: string;
  explanation?: string;
}

export interface StorageData {
  selectedModel?: string;
  recentTasks?: string[];
  favorites?: string[];
  userPreferences?: UserPreferences;
}

export interface UserPreferences {
  priority: 'quality' | 'speed' | 'cost' | 'balanced';
  budget: 'free' | 'low' | 'medium' | 'high';
  expertise: 'beginner' | 'intermediate' | 'expert';
  useCase: 'personal' | 'professional' | 'enterprise';
}

export interface RecommendationResult {
  primary: ModelRecommendation[];
  alternatives: ModelRecommendation[];
  reasoning: string[];
  estimatedCost?: string;
  bestPractices?: string[];
}

export interface FilterOptions {
  modelType: 'llm' | 'image' | 'video' | 'audio' | 'all';
  tier?: ModelRecommendation['tier'];
  platform?: string;
  budget?: 'free' | 'paid' | 'enterprise';
}

export interface ComparisonMetrics {
  quality: number;
  speed: number;
  cost: number;
  easeOfUse: number;
  features: number;
}

export interface ModelComparison {
  models: ModelRecommendation[];
  metrics: ComparisonMetrics[];
  winner: {
    overall: string;
    byCategory: {
      quality: string;
      speed: string;
      cost: string;
    };
  };
}