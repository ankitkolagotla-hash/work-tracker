/**
 * Common App activity description optimizer — a rule-based formatter, not a
 * generative rewrite. It enforces the 150-character limit, flags missing
 * action verbs and missing quantifiable metrics, and flags common filler
 * phrases, but it never invents accomplishments or numbers the student
 * didn't provide.
 */

export const STRONG_ACTION_VERBS = [
  'Led', 'Founded', 'Directed', 'Organized', 'Launched', 'Built', 'Coached', 'Captained',
  'Managed', 'Designed', 'Created', 'Coordinated', 'Initiated', 'Spearheaded', 'Produced',
  'Trained', 'Mentored', 'Analyzed', 'Developed', 'Established', 'Championed', 'Negotiated',
];

const FILLER_PATTERNS = [
  /\bhelped with\b/i,
  /\bwas responsible for\b/i,
  /\bworked on\b/i,
  /\bassisted in\b/i,
  /\bin charge of\b/i,
  /\bwas a member of\b/i,
];

const MAX_LENGTH = 150;

export interface ActivityOptimizerResult {
  charCount: number;
  withinLimit: boolean;
  startsWithActionVerb: boolean;
  hasQuantifiableMetric: boolean;
  fillerPhrasesFound: string[];
  truncatedSuggestion: string;
}

export function optimizeActivity(rawText: string): ActivityOptimizerResult {
  const trimmed = rawText.trim();
  const firstWord = trimmed.split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, '') ?? '';
  const startsWithActionVerb = STRONG_ACTION_VERBS.some((v) => v.toLowerCase() === firstWord.toLowerCase());
  const hasQuantifiableMetric = /\d/.test(trimmed);
  const fillerPhrasesFound = FILLER_PATTERNS.filter((p) => p.test(trimmed)).map((p) => p.source.replace(/\\b/g, '').replace(/\\/g, ''));

  let truncatedSuggestion = trimmed;
  if (trimmed.length > MAX_LENGTH) {
    const slice = trimmed.slice(0, MAX_LENGTH);
    const lastSpace = slice.lastIndexOf(' ');
    truncatedSuggestion = (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim();
  }

  return {
    charCount: trimmed.length,
    withinLimit: trimmed.length <= MAX_LENGTH,
    startsWithActionVerb,
    hasQuantifiableMetric,
    fillerPhrasesFound,
    truncatedSuggestion,
  };
}
