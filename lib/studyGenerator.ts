import { DrillCard, FreeResponsePrompt, MCQQuestion, NotePoint, StudyPack, SynthesisNote } from '../types/assessment';
import { splitConceptLine } from './notes';

const MARKS_RE = /\(\s*(\d+)\s*marks?\s*\)/i;
const COMMAND_VERB_RE = /^(explain|discuss|evaluate|describe|outline|compare|analyse|analyze|justify|examine|assess|to what extent)\b/i;

function isFreeResponseLine(line: string): boolean {
  return MARKS_RE.test(line) || COMMAND_VERB_RE.test(line);
}

// Structural noise commonly copy-pasted alongside real content: LMS section
// headers, standalone point badges, and Canvas metadata lines that carry no
// study content of their own.
const STRUCTURAL_NOISE_PATTERNS: RegExp[] = [
  /^lesson\s+\d+\b/i,
  /^module\s+\d+\b/i,
  /^unit\s+\d+\b/i,
  /^\d+(?:\.\d+)?\s*pts?\.?$/i,
  /^\d+\s*points?\s*possible$/i,
  /^due\s*:?\s*.*$/i,
  /^points?\s*possible\s*:?\s*\d*$/i,
  /^submission\s*type\s*:?/i,
  /^available\s+(?:until|from)\b/i,
];

function isStructuralNoiseLine(line: string): boolean {
  return STRUCTURAL_NOISE_PATTERNS.some((re) => re.test(line));
}

/** A short standalone line with no term/definition structure — treated as a section heading. */
function isHeadingLine(line: string): boolean {
  if (line.includes(':') || line.includes(' - ')) return false;
  if (isFreeResponseLine(line)) return false;
  if (line.length === 0 || line.length > 60) return false;
  if (/[.?!]$/.test(line)) return false;
  return true;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// --- Semantic distractor categorization -------------------------------------
// Groups each concept into a rough semantic bucket so MCQ distractors are
// pulled from the SAME bucket when possible (a Hierarchy term gets Hierarchy
// distractors, not an unrelated Mechanism definition) — this makes the wrong
// options plausible instead of obviously mismatched.

type ConceptCategory = 'Mechanism' | 'Hierarchy' | 'Taxon' | 'General';

const HIERARCHY_KEYWORDS = [
  'hierarchy', 'domain', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus',
  'rank', 'classification', 'taxonomic', 'taxonomy', 'category', 'level',
];
const MECHANISM_KEYWORDS = [
  'process', 'mechanism', 'pathway', 'cycle', 'reaction', 'system', 'function',
  'transfer', 'conversion', 'stage', 'phase', 'response',
];
const TAXON_KEYWORDS = ['species', 'organism', 'taxon', 'population', 'specimen'];

function categorizeConcept(term: string, definition: string): ConceptCategory {
  const text = `${term} ${definition}`.toLowerCase();
  if (HIERARCHY_KEYWORDS.some((k) => text.includes(k))) return 'Hierarchy';
  if (MECHANISM_KEYWORDS.some((k) => text.includes(k))) return 'Mechanism';
  if (TAXON_KEYWORDS.some((k) => text.includes(k))) return 'Taxon';
  return 'General';
}

interface Concept {
  term: string;
  definition: string;
  category: ConceptCategory;
}

function buildMCQs(concepts: Concept[]): MCQQuestion[] {
  if (concepts.length < 2) return [];

  return concepts.map((concept, idx) => {
    const others = concepts.filter((_, i) => i !== idx);
    const sameCategory = others.filter((c) => c.category === concept.category);
    const otherCategory = others.filter((c) => c.category !== concept.category);

    // Prefer same-category distractors (a real semantic distinction test);
    // fall back to any other concept if the category is too small.
    const distractorPool = [...shuffle(sameCategory), ...shuffle(otherCategory)].map((c) => c.definition);
    const distractors = distractorPool.slice(0, 3);
    while (distractors.length < 3) {
      distractors.push('Not one of the studied concepts');
    }

    const options = shuffle([concept.definition, ...distractors]);
    return {
      id: `mcq-${idx}`,
      prompt: `Which best defines: ${concept.term}?`,
      options,
      correctIndex: options.indexOf(concept.definition),
    };
  });
}

function buildExemplar(prompt: string, concepts: Concept[]): string {
  const keyTerms = concepts.slice(0, 2);
  if (keyTerms.length === 0) {
    return 'A strong response states its claim in the first sentence, then supports it with two or three specific pieces of evidence from your notes before explaining why that evidence proves the claim.';
  }
  const claim = keyTerms.map((c) => c.term).join(' and ');
  const evidence = keyTerms.map((c) => `${c.term.toLowerCase()} (${c.definition.toLowerCase()})`).join('; ');
  return `A strong response opens by directly answering the prompt using ${claim}, then supports that claim with the specific evidence: ${evidence}. It closes by explaining how that evidence answers the command verb in the prompt (${prompt.split(' ').slice(0, 2).join(' ').toLowerCase()}...) rather than just restating the definitions.`;
}

export const EMPTY_STUDY_PACK: StudyPack = { notes: [], flashcards: [], mcqs: [], freeResponse: [] };

/**
 * Extracts a full multi-format study pack — Cornell-style synthesis notes, flashcards,
 * a semantically-categorized MCQ bank, and scenario/free-response prompts with a
 * keyword rubric, exemplar answer, and word-count gate — from raw pasted materials.
 * LMS structural noise (lesson/module headers, point badges, Canvas metadata) is
 * filtered out before parsing so it never pollutes the generated content.
 */
export function generateStudyPack(raw: string): StudyPack {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isStructuralNoiseLine(l));

  if (lines.length === 0) return EMPTY_STUDY_PACK;

  const notes: SynthesisNote[] = [];
  const flashcards: DrillCard[] = [];
  const freeResponse: FreeResponsePrompt[] = [];
  const concepts: Concept[] = [];

  let currentHeading = 'Key Concepts';
  let currentPoints: NotePoint[] = [];

  const flushHeading = () => {
    if (currentPoints.length > 0) {
      notes.push({ id: `note-${notes.length}`, heading: currentHeading, points: currentPoints });
    }
    currentPoints = [];
  };

  lines.forEach((line, idx) => {
    if (isFreeResponseLine(line)) {
      const marksMatch = line.match(MARKS_RE);
      const marks = marksMatch ? Number(marksMatch[1]) : null;
      freeResponse.push({
        id: `fr-${idx}`,
        prompt: line,
        marks,
        markscheme: '',
        keywordRubric: [],
        exemplar: '',
        minWords: marks ? Math.max(40, marks * 15) : 60,
      });
      return;
    }

    const parsed = splitConceptLine(line);
    if (parsed) {
      const category = categorizeConcept(parsed.prompt, parsed.answer);
      concepts.push({ term: parsed.prompt, definition: parsed.answer, category });
      flashcards.push({ id: `card-${idx}`, prompt: parsed.prompt, answer: parsed.answer });
      currentPoints.push({ term: parsed.prompt, text: parsed.answer });
      return;
    }

    if (isHeadingLine(line)) {
      flushHeading();
      currentHeading = line;
      return;
    }

    currentPoints.push({ term: '', text: line });
  });
  flushHeading();

  const keyTerms = concepts.slice(0, 5).map((c) => `${c.term}: ${c.definition}`);
  const keywordRubric = concepts.slice(0, 5).map((c) => c.term);
  freeResponse.forEach((fr) => {
    fr.markscheme =
      keyTerms.length > 0
        ? `Key criteria to include: ${keyTerms.join(' | ')}`
        : 'Structure your answer with a clear claim, supporting evidence, and explanation.';
    fr.keywordRubric = keywordRubric;
    fr.exemplar = buildExemplar(fr.prompt, concepts);
  });

  return {
    notes,
    flashcards,
    mcqs: buildMCQs(concepts),
    freeResponse,
  };
}
