import { DrillCard, FreeResponsePrompt, MCQQuestion, NotePoint, StudyPack, SynthesisNote } from '../types/assessment';
import { splitConceptLine } from './notes';

const MARKS_RE = /\(\s*(\d+)\s*marks?\s*\)/i;
const COMMAND_VERB_RE = /^(explain|discuss|evaluate|describe|outline|compare|analyse|analyze|justify|examine|assess|to what extent)\b/i;

function isFreeResponseLine(line: string): boolean {
  return MARKS_RE.test(line) || COMMAND_VERB_RE.test(line);
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

function buildMCQs(concepts: { term: string; definition: string }[]): MCQQuestion[] {
  if (concepts.length < 2) return [];

  return concepts.map((concept, idx) => {
    const distractorPool = concepts
      .filter((_, i) => i !== idx)
      .map((c) => c.definition);
    const distractors = shuffle(distractorPool).slice(0, 3);
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

export const EMPTY_STUDY_PACK: StudyPack = { notes: [], flashcards: [], mcqs: [], freeResponse: [] };

/**
 * Extracts a full multi-format study pack — Cornell-style synthesis notes, flashcards,
 * an auto-generated MCQ bank, and scenario/free-response prompts with a markscheme —
 * from raw pasted materials.
 */
export function generateStudyPack(raw: string): StudyPack {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return EMPTY_STUDY_PACK;

  const notes: SynthesisNote[] = [];
  const flashcards: DrillCard[] = [];
  const freeResponse: FreeResponsePrompt[] = [];
  const concepts: { term: string; definition: string }[] = [];

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
      freeResponse.push({
        id: `fr-${idx}`,
        prompt: line,
        marks: marksMatch ? Number(marksMatch[1]) : null,
        markscheme: '',
      });
      return;
    }

    const parsed = splitConceptLine(line);
    if (parsed) {
      concepts.push({ term: parsed.prompt, definition: parsed.answer });
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
  freeResponse.forEach((fr) => {
    fr.markscheme =
      keyTerms.length > 0
        ? `Key criteria to include: ${keyTerms.join(' | ')}`
        : 'Structure your answer with a clear claim, supporting evidence, and explanation.';
  });

  return {
    notes,
    flashcards,
    mcqs: buildMCQs(concepts),
    freeResponse,
  };
}
