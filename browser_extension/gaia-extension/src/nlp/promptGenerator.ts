import { PROMPT_TEMPLATES } from "./promptTemplates";

export function generatePromptSuggestions(topic: string) {
  return [
    {
      type: "Short Answer",
      prompt: PROMPT_TEMPLATES.short(topic)
    },
    {
      type: "Detailed Explanation",
      prompt: PROMPT_TEMPLATES.detailed(topic)
    },
    {
      type: "Step by Step",
      prompt: PROMPT_TEMPLATES.stepByStep(topic)
    },
    {
      type: "Research Style",
      prompt: PROMPT_TEMPLATES.research(topic)
    },
    {
      type: "Reasoning Based",
      prompt: PROMPT_TEMPLATES.reasoning(topic)
    },
    {
      type: "Creative Explanation",
      prompt: PROMPT_TEMPLATES.creative(topic)
    }
  ];
}
