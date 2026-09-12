import { ACTGradedItem } from '../types/lifeOs';

/**
 * Client-side OCR + regex parsing for ACT answer sheets / test pages. This is
 * genuine OCR (Tesseract.js, running fully in-browser) feeding a deterministic
 * regex parser — not an LLM reading the image, and not fabricated results.
 * Tesseract's core/wasm/lang-data load from its CDN at runtime.
 */

let workerPromise: Promise<any> | null = null;

async function getWorker() {
  if (!workerPromise) {
    const { createWorker } = await import('tesseract.js');
    workerPromise = createWorker('eng');
  }
  return workerPromise;
}

export async function recognizeImageText(file: File | Blob): Promise<string> {
  const worker = await getWorker();
  const { data } = await worker.recognize(file);
  return data.text as string;
}

/** Release the OCR worker's resources. Call when the intake panel unmounts. */
export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return;
  const worker = await workerPromise;
  await worker.terminate();
  workerPromise = null;
}

/**
 * Parses "question number -> letter answer" pairs out of raw OCR text.
 * Handles the common answer-sheet formats: "1. B", "1) B", "1: B", "1 B",
 * "1-B". Heuristic, not perfect — OCR noise and math-problem digit/letter
 * pairs can produce false matches, so results should be spot-checked.
 */
export function parseAnswersFromText(text: string): Map<number, string> {
  const answers = new Map<number, string>();
  const pattern = /\b(\d{1,3})\s*[.):\-]?\s*([A-Ha-h])\b/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const questionNumber = parseInt(match[1], 10);
    if (questionNumber < 1 || questionNumber > 75) continue;
    answers.set(questionNumber, match[2].toUpperCase());
  }
  return answers;
}

/**
 * Grades a "selected answers" OCR pass against an optional "answer key" OCR
 * pass. Without a key, every item is left isCorrect: null for the student to
 * mark by hand — we never fabricate a correct answer we didn't actually read.
 */
export function gradeAnswers(selectedText: string, answerKeyText: string | null): ACTGradedItem[] {
  const selected = parseAnswersFromText(selectedText);
  const key = answerKeyText ? parseAnswersFromText(answerKeyText) : null;

  return Array.from(selected.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([questionNumber, selectedAnswer]) => {
      const correctAnswer = key?.get(questionNumber) ?? null;
      return {
        questionNumber,
        selectedAnswer,
        correctAnswer,
        isCorrect: correctAnswer ? selectedAnswer === correctAnswer : null,
      };
    });
}
