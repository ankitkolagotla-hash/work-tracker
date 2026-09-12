import { UniversityFitPreferences, UniversityMatch, UniversityProfile, SelectivityTier } from '../types/lifeOs';
import { UNIVERSITY_DATASET } from './universityData';

/** Acceptance-rate cutoffs used only to bucket the illustrative dataset — not a formal ranking system. */
export function tierFromAcceptanceRate(acceptanceRatePct: number): SelectivityTier {
  if (acceptanceRatePct < 20) return 'Reach';
  if (acceptanceRatePct < 50) return 'Target';
  return 'Safety';
}

/**
 * Deterministic fit scoring: major overlap counts most, campus size and
 * location vibe each add a fixed bonus when they match a stated preference.
 * "No Preference" on any field simply drops that field from scoring instead
 * of penalizing the school.
 */
function scoreMatch(school: UniversityProfile, prefs: UniversityFitPreferences): number {
  let score = 0;

  if (prefs.targetMajors.length > 0) {
    const overlap = school.strongMajors.filter((m) => prefs.targetMajors.includes(m)).length;
    score += Math.min(50, overlap * 25);
  } else {
    score += 25;
  }

  if (prefs.campusSize === 'No Preference' || school.campusSize === prefs.campusSize) score += 20;
  if (prefs.locationVibe === 'No Preference' || school.locationVibe === prefs.locationVibe) score += 20;

  const tier = tierFromAcceptanceRate(school.acceptanceRatePct);
  if (prefs.selectivityTier === 'No Preference' || tier === prefs.selectivityTier) score += 10;

  return Math.min(100, score);
}

export function matchUniversities(
  prefs: UniversityFitPreferences,
  dataset: UniversityProfile[] = UNIVERSITY_DATASET
): UniversityMatch[] {
  return dataset
    .map((university) => ({
      university,
      tier: tierFromAcceptanceRate(university.acceptanceRatePct),
      matchScore: scoreMatch(university, prefs),
    }))
    .filter((m) => prefs.selectivityTier === 'No Preference' || m.tier === prefs.selectivityTier)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export const ALL_MAJORS = Array.from(new Set(UNIVERSITY_DATASET.flatMap((u) => u.strongMajors))).sort();
