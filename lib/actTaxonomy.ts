import { ACTSection } from '../types/lifeOs';

/**
 * Standard ACT question taxonomies per section, plus a keyword-based
 * classifier that guesses which taxonomy an extracted question snippet
 * belongs to. Deterministic keyword matching, not a language model — every
 * match is explainable by the keyword that triggered it, and an
 * unrecognized snippet honestly falls back to "Unclassified" rather than
 * guessing confidently.
 */

export const ACT_TAXONOMIES: Record<ACTSection, string[]> = {
  English: ['Comma Splices', 'Semicolons & Colons', 'Modifier Placement', 'Rhetorical Skills', 'Sentence Boundaries', 'Transitions'],
  Math: ['Matrix Operations', 'Coordinate Geometry', 'Trig Identities', 'Probability', 'Systems of Equations', 'Functions'],
  Reading: ['Paired Passages', 'Line Reference', 'Main Idea', 'Author\'s Purpose', 'Vocabulary in Context'],
  Science: ['Conflicting Viewpoints', 'Data Representation', 'Research Summaries', 'Figure/Table Interpretation'],
};

interface TaxonomyRule {
  section: ACTSection;
  tag: string;
  keywords: RegExp;
}

const RULES: TaxonomyRule[] = [
  { section: 'English', tag: 'Comma Splices', keywords: /\bcomma splice|,\s*(the|it|she|he|they)\b/i },
  { section: 'English', tag: 'Semicolons & Colons', keywords: /;|:\s*\w/ },
  { section: 'English', tag: 'Modifier Placement', keywords: /\bdangling|misplaced modifier|-ing\b.*,/i },
  { section: 'English', tag: 'Rhetorical Skills', keywords: /\b(relevance|transition|emphasis|tone)\b/i },
  { section: 'Math', tag: 'Matrix Operations', keywords: /\bmatrix|matrices\b/i },
  { section: 'Math', tag: 'Coordinate Geometry', keywords: /\b(slope|midpoint|x-axis|y-axis|coordinate plane)\b/i },
  { section: 'Math', tag: 'Trig Identities', keywords: /\b(sin|cos|tan|sec|csc|cot|trig)\b/i },
  { section: 'Math', tag: 'Probability', keywords: /\bprobability|odds|chance of\b/i },
  { section: 'Math', tag: 'Systems of Equations', keywords: /\bsystem of equations|solve for x and y\b/i },
  { section: 'Reading', tag: 'Paired Passages', keywords: /\bpassage a\b[\s\S]*\bpassage b\b/i },
  { section: 'Reading', tag: 'Line Reference', keywords: /\bline(s)? \d+/i },
  { section: 'Reading', tag: 'Author\'s Purpose', keywords: /\bauthor('s)? (purpose|intent|tone)\b/i },
  { section: 'Science', tag: 'Conflicting Viewpoints', keywords: /\bscientist (1|2|one|two)\b|\bconflicting viewpoints\b/i },
  { section: 'Science', tag: 'Data Representation', keywords: /\b(figure|table|graph)\s*\d/i },
  { section: 'Science', tag: 'Research Summaries', keywords: /\bexperiment|trial \d|study \d/i },
];

export function classifyQuestionTaxonomy(text: string): { section: ACTSection | null; tag: string } {
  for (const rule of RULES) {
    if (rule.keywords.test(text)) return { section: rule.section, tag: rule.tag };
  }
  return { section: null, tag: 'Unclassified' };
}
