// ==================== TYPE DEFINITIONS ====================

export interface CO2Emissions {
  perRequest: string;
  per1MTokens?: string;
  perImage?: string;
  perMinute?: string;
  rating: 'very-low' | 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high' | 'very-high';
  comparison: string;
}

export interface ModelRecommendation {
  name: string;
  platform: string;
  icon: string;
  description: string;
  bestFor: string[];
  color: string;
  tier: 'flagship' | 'premium' | 'efficient' | 'specialized' | 'value' | 'open-source' | 'enterprise';
  pricing: string;
  contextWindow?: string;
  features?: string[];
  strengths: string[];
  limitations: string[];
  useCase: string;
  co2Emissions?: CO2Emissions;
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

export interface PlatformFeatures {
  streaming?: boolean;
  batching?: boolean;
  fineTuning?: boolean;
  functionCalling?: boolean;
  vision?: boolean;
  audio?: boolean;
}

export interface RecommendationCriteria {
  taskType: string;
  priority: 'quality' | 'speed' | 'cost' | 'balanced' | 'eco-friendly';
  budget: 'free' | 'low' | 'medium' | 'high';
  expertise: 'beginner' | 'intermediate' | 'expert';
  useCase: 'personal' | 'professional' | 'enterprise';
}

export interface SmartRecommendation {
  primary: ModelRecommendation[];
  alternatives: ModelRecommendation[];
  reasoning: string[];
}

export interface UserPreferences {
  priority: 'quality' | 'speed' | 'cost' | 'balanced' | 'eco-friendly';
  budget: 'free' | 'low' | 'medium' | 'high';
  expertise: 'beginner' | 'intermediate' | 'expert';
  useCase: 'personal' | 'professional' | 'enterprise';
}

export interface StorageData {
  userPreferences?: UserPreferences;
  showEcoMetrics?: boolean;
  comparisonModels?: string[];
}

export interface FilterOptions {
  type: 'all' | 'llm' | 'image' | 'video' | 'audio' | 'eco-friendly';
  tier?: ModelRecommendation['tier'];
  platform?: string;
}