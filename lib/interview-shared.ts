// Pure constants + types for Interview Me. Safe to import from client
// components. Server-only DB helpers live in lib/interview.ts.

export const DIMENSIONS = [
  "background",
  "expertise",
  "opinions",
  "audience",
  "recent_work",
  "anti_patterns",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABEL: Record<Dimension, string> = {
  background: "Background",
  expertise: "Expertise",
  opinions: "Strong opinions",
  audience: "Audience",
  recent_work: "Recent work",
  anti_patterns: "Anti-patterns",
};

export const DIMENSION_PROMPT: Record<Dimension, string> = {
  background: "Who you are, your role, and what you actually do day to day.",
  expertise: "Where you've earned the right to an opinion (years, scope, scars).",
  opinions: "Strong or contrarian views you hold; conventional wisdom you reject.",
  audience: "Who you are writing for; what they care about; what they'd skip past.",
  recent_work: "What you're working on right now; what's changed recently.",
  anti_patterns: "Patterns you've seen go wrong; mistakes others should avoid.",
};
