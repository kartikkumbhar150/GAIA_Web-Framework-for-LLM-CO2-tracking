export const PROMPT_TEMPLATES = {
  short: (topic: string, words: number = 150) =>
    `Explain ${topic} briefly in 3–4 bullet points. Answer in approximately ${words} words.`,

  detailed: (topic: string, words: number = 500) =>
    `Explain ${topic} in detail with clear explanations and examples. Answer in approximately ${words} words.`,

  stepByStep: (topic: string, words: number = 400) =>
    `Explain ${topic} step by step, assuming the reader is a beginner. Answer in approximately ${words} words.`,

  research: (topic: string, words: number = 800) =>
    `Provide a structured, research-style explanation of ${topic}. Include headings and key points. Answer in approximately ${words} words.`,

  reasoning: (topic: string, words: number = 400) =>
    `Explain why ${topic} works the way it does. Include logical reasoning and examples. Answer in approximately ${words} words.`,

  creative: (topic: string, words: number = 300) =>
    `Explain ${topic} using a creative or intuitive analogy that is easy to understand. Answer in approximately ${words} words.`
};
