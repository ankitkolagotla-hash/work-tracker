import { ACTSection, ACTSectionScore, ACTSectionSession, ACT_SECTIONS } from '../types/lifeOs';

/**
 * Blends the student's manually-entered current score (40% weight) with an
 * accuracy-derived estimate built from logged practice sessions (60% weight),
 * once any sessions exist for that section. With zero logged sessions for a
 * section, the manual score is used as-is — there's nothing to blend against.
 *
 * "Full Mock" sessions don't map to a single section, so their attempted/
 * correct counts are split evenly across all four real sections (1/4 weight
 * each) before the accuracy estimate is computed.
 */

const MANUAL_WEIGHT = 0.4;
const ACCURACY_WEIGHT = 0.6;
const MAX_ACT_SCORE = 36;

export interface PredictedSectionScore {
  section: ACTSection;
  current: number;
  predicted: number;
  sessionsLogged: number;
  accuracyPct: number | null;
}

export function predictSectionScores(
  scores: ACTSectionScore[],
  sessions: ACTSectionSession[]
): PredictedSectionScore[] {
  return ACT_SECTIONS.map((section) => {
    const scoreEntry = scores.find((s) => s.section === section);
    const current = scoreEntry?.current ?? 0;

    let attempted = 0;
    let correct = 0;
    let sessionsLogged = 0;

    sessions.forEach((session) => {
      if (session.section === section) {
        attempted += session.questionsAttempted;
        correct += session.questionsCorrect;
        sessionsLogged += 1;
      } else if (session.section === 'Full Mock') {
        attempted += session.questionsAttempted / 4;
        correct += session.questionsCorrect / 4;
        sessionsLogged += 1;
      }
    });

    if (attempted === 0) {
      return { section, current, predicted: current, sessionsLogged: 0, accuracyPct: null };
    }

    const accuracy = correct / attempted;
    const accuracyScore = Math.min(MAX_ACT_SCORE, Math.max(1, accuracy * MAX_ACT_SCORE));
    const predicted = Math.round(current * MANUAL_WEIGHT + accuracyScore * ACCURACY_WEIGHT);

    return {
      section,
      current,
      predicted: Math.min(MAX_ACT_SCORE, Math.max(1, predicted)),
      sessionsLogged,
      accuracyPct: Math.round(accuracy * 100),
    };
  });
}

export function predictComposite(predicted: PredictedSectionScore[]): number {
  if (predicted.length === 0) return 0;
  const sum = predicted.reduce((acc, p) => acc + p.predicted, 0);
  return Math.round(sum / predicted.length);
}
