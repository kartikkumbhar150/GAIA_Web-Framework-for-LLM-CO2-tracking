import type { ModelRecommendation, TaskCategory } from './types';

export const MODEL_RECOMMENDATIONS: ModelRecommendation[] = [
  {
    name: "Claude Sonnet 4.5",
    icon: "🧠",
    description: "Smart, efficient model for everyday tasks",
    bestFor: ["General queries", "Coding", "Analysis"],
    color: "#16a34a"
  },
  {
    name: "GPT-4",
    icon: "⚡",
    description: "Powerful reasoning and creative tasks",
    bestFor: ["Complex problems", "Creative writing", "Research"],
    color: "#7c3aed"
  },
  {
    name: "Claude Opus 4.5",
    icon: "🎯",
    description: "Advanced model for complex reasoning",
    bestFor: ["Deep analysis", "Long documents", "Technical tasks"],
    color: "#dc2626"
  },
  {
    name: "Gemini Pro",
    icon: "💎",
    description: "Multi-modal AI with strong reasoning",
    bestFor: ["Image analysis", "Data tasks", "Coding"],
    color: "#0891b2"
  }
];

export const TASK_CATEGORIES: TaskCategory[] = [
  {
    id: "writing",
    name: "Writing & Content",
    icon: "✍️",
    tasks: [
      "Blog post",
      "Email draft",
      "Social media post",
      "Product description",
      "Essay writing"
    ]
  },
  {
    id: "coding",
    name: "Coding & Technical",
    icon: "💻",
    tasks: [
      "Debug code",
      "Write function",
      "Code review",
      "API integration",
      "Database query"
    ]
  },
  {
    id: "analysis",
    name: "Analysis & Research",
    icon: "📊",
    tasks: [
      "Data analysis",
      "Market research",
      "Competitive analysis",
      "Document summary",
      "Trend analysis"
    ]
  },
  {
    id: "creative",
    name: "Creative & Design",
    icon: "🎨",
    tasks: [
      "Brainstorming",
      "Story writing",
      "UI/UX ideas",
      "Marketing copy",
      "Video script"
    ]
  }
];
