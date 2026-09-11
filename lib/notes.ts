export const MIN_STRUCTURED_CONCEPTS = 3;

export interface ParsedDrillLine {
  prompt: string;
  answer: string;
}

function splitLine(line: string): ParsedDrillLine | null {
  if (line.includes(':')) {
    const idx = line.indexOf(':');
    const prompt = line.slice(0, idx).trim();
    const answer = line.slice(idx + 1).trim();
    if (prompt && answer) return { prompt, answer };
  }
  if (line.includes(' - ')) {
    const idx = line.indexOf(' - ');
    const prompt = line.slice(0, idx).trim();
    const answer = line.slice(idx + 3).trim();
    if (prompt && answer) return { prompt, answer };
  }
  return null;
}

export function parseDrillLines(raw: string): ParsedDrillLine[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map(splitLine)
    .filter((x): x is ParsedDrillLine => x !== null);
}

export interface MaterialValidation {
  valid: boolean;
  conceptCount: number;
  message?: string;
}

export const INTAKE_WARNING =
  'Missing core definitions or key learning points. Add structured notes or syllabus objectives to generate your prep modules.';

export function validateMaterials(raw: string): MaterialValidation {
  const lines = parseDrillLines(raw);
  const valid = lines.length >= MIN_STRUCTURED_CONCEPTS;
  return {
    valid,
    conceptCount: lines.length,
    message: valid ? undefined : INTAKE_WARNING,
  };
}
