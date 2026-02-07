export const PROMPT_TEMPLATES = {
  short: (topic: string) =>
    `Explain ${topic} briefly in 3–4 bullet points.`,

  detailed: (topic: string) =>
    `Explain ${topic} in detail with clear explanations and examples.`,

  stepByStep: (topic: string) =>
    `Explain ${topic} step by step, assuming the reader is a beginner.`,

  research: (topic: string) =>
    `Provide a structured, research-style explanation of ${topic}. Include headings and key points.`,

  reasoning: (topic: string) =>
    `Explain why ${topic} works the way it does. Include logical reasoning and examples.`,

  creative: (topic: string) =>
    `Explain ${topic} using a creative or intuitive analogy that is easy to understand.`
};
