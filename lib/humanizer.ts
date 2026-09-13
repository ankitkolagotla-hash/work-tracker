// Wikipedia "signs of AI writing" audit + H.E.A.R.T. (answer-first, concrete
// evidence, real voice) structural cleanup. This is a heuristic, regex-based
// pass — it flags and fixes formatting-level tells (em dashes, vague
// attribution, stock phrases) automatically. Rhetorical-structure issues
// (rule-of-three triplets, negative parallelism, claim-first ordering) are
// flagged for the student to fix by hand, since rewriting sentence structure
// or argument content automatically risks changing the writer's meaning —
// that decision has to stay with the student.

export interface AuditFinding {
  pattern: string;
  matches: string[];
  recommendation: string;
}

export interface AuditResult {
  findings: AuditFinding[];
  missingEmpiricalSignals: string[];
  /** 0-100, higher = cleaner of AI-writing tells. */
  score: number;
}

export interface ParaphraseStem {
  stem: string;
  reference: string;
}

export interface DualDraft {
  paraphraseStems: ParaphraseStem[];
  humanizedDraft: string;
  audit: AuditResult;
}

const EM_DASH_RE = /\s*—\s*/g;

const VAGUE_ATTRIBUTION_RE =
  /\b(studies show that|experts say that|research suggests that|many believe that|it is (?:often|widely) (?:said|believed) that)\b/gi;

const NEGATIVE_PARALLELISM_RE = /\bnot only\b[^.?!]{0,80}\bbut also\b/gi;

const EDITORIALIZING_RE =
  /\b(it'?s worth noting that|interestingly,?|notably,?|importantly,?|crucially,?|unsurprisingly,?|it should be noted that)\b/gi;

const RULE_OF_THREE_RE = /\b([A-Za-z]+),\s+([A-Za-z]+),\s+(?:and|or)\s+([A-Za-z]+)\b/g;

const STOCK_REPLACEMENTS: [RegExp, string][] = [
  [/\bdelves? into\b/gi, 'looks closely at'],
  [/\btapestry\b/gi, 'mix'],
  [/\bunderscores?\b/gi, 'highlights'],
  [/\bboasts?\b/gi, 'has'],
  [/\bvibrant\b/gi, 'lively'],
  [/\btestament to\b/gi, 'evidence of'],
  [/\bnavigate(?:s|d)? the complexit(?:y|ies) of\b/gi, 'work through'],
  [/\bplays? a pivotal role\b/gi, 'matters a great deal'],
  [/\bin today'?s society\b/gi, 'today'],
  [/\bit is important to note that\b/gi, ''],
  [/\bin conclusion,?\s*/gi, ''],
  [/\bmultifaceted\b/gi, 'complex'],
  [/\brich history\b/gi, 'long history'],
  [/\bstands? as a\b/gi, 'is a'],
];

function auditText(text: string): AuditResult {
  const findings: AuditFinding[] = [];

  const emDashMatches = text.match(/—/g);
  if (emDashMatches && emDashMatches.length > 0) {
    findings.push({
      pattern: 'Em dash overuse',
      matches: [`${emDashMatches.length} em dash${emDashMatches.length === 1 ? '' : 'es'} found`],
      recommendation: 'Replace with a period, comma, or colon depending on the break in thought.',
    });
  }

  const attributionMatches = text.match(VAGUE_ATTRIBUTION_RE);
  if (attributionMatches) {
    findings.push({
      pattern: 'Vague attribution',
      matches: [...new Set(attributionMatches)],
      recommendation: 'Name the specific study, author, or source instead of an unnamed authority.',
    });
  }

  const editorializingMatches = text.match(EDITORIALIZING_RE);
  if (editorializingMatches) {
    findings.push({
      pattern: 'Editorializing insertion',
      matches: [...new Set(editorializingMatches)],
      recommendation: 'Cut the interjection and state the point plainly — let the evidence carry the weight, not the narrator\'s commentary.',
    });
  }

  const negParallelMatches = text.match(NEGATIVE_PARALLELISM_RE);
  if (negParallelMatches) {
    findings.push({
      pattern: 'Negative parallelism ("not only... but also")',
      matches: negParallelMatches,
      recommendation: 'State the point directly instead of the not-only/but-also frame.',
    });
  }

  const tripletMatches = [...text.matchAll(RULE_OF_THREE_RE)].map((m) => m[0]);
  if (tripletMatches.length > 0) {
    findings.push({
      pattern: 'Rule-of-three triplet',
      matches: tripletMatches,
      recommendation: 'Vary the rhythm — not every list needs exactly three items.',
    });
  }

  STOCK_REPLACEMENTS.forEach(([re]) => {
    const m = text.match(re);
    if (m) {
      findings.push({
        pattern: `Stock phrase: "${m[0].trim()}"`,
        matches: [...new Set(m)],
        recommendation: 'Replace with plainer, more specific language.',
      });
    }
  });

  const missingEmpiricalSignals: string[] = [];
  if (!/\d/.test(text)) {
    missingEmpiricalSignals.push('No numbers, dates, or figures detected — consider adding a concrete data point.');
  }
  if (!/"[^"]{6,}"|'[^']{6,}'/.test(text)) {
    missingEmpiricalSignals.push('No direct quote or named source detected.');
  }
  if (!/^[^.?!]{0,120}[.?!]/.test(text.trim())) {
    missingEmpiricalSignals.push('Opening sentence runs long before its first claim — lead with the answer.');
  }

  const penalty = findings.reduce((sum, f) => sum + f.matches.length, 0) * 8;
  const score = Math.max(0, 100 - penalty);

  return { findings, missingEmpiricalSignals, score };
}

function applyStructuralPass(text: string): string {
  let cleaned = text.replace(EM_DASH_RE, ', ');
  cleaned = cleaned.replace(VAGUE_ATTRIBUTION_RE, '');
  cleaned = cleaned.replace(EDITORIALIZING_RE, '');
  STOCK_REPLACEMENTS.forEach(([re, replacement]) => {
    cleaned = cleaned.replace(re, replacement);
  });
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
  cleaned = cleaned.replace(/(^|[.!?]\s+)([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
  return cleaned;
}

function buildParaphraseStems(text: string): ParaphraseStem[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences.map((sentence) => {
    const words = sentence.split(/\s+/);
    const leadCount = Math.min(6, Math.max(3, Math.floor(words.length / 3)));
    const stem = `${words.slice(0, leadCount).join(' ')} ___________________`;
    return { stem, reference: sentence };
  });
}

/**
 * Ingests an assignment prompt or pasted draft text and produces both the
 * paraphrasable stem draft (Mode A) and the H.E.A.R.T.-cleaned draft (Mode B),
 * plus the Wikipedia-tells audit for whichever draft the student submits.
 */
export function humanizeDraft(rawText: string): DualDraft {
  const trimmed = rawText.trim();
  return {
    paraphraseStems: buildParaphraseStems(trimmed),
    humanizedDraft: applyStructuralPass(trimmed),
    audit: auditText(trimmed),
  };
}

/** Re-run just the audit — used when the student edits their own draft in place. */
export function auditDraft(text: string): AuditResult {
  return auditText(text);
}
