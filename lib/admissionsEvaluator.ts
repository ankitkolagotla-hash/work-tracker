import { StudentProfile, UniversityProfile, SelectivityTier, AdmissionsEvaluation } from '../types/lifeOs';
import { tierFromAcceptanceRate } from './universityMatcher';

/**
 * "Brutal" admissions evaluator: a deterministic, rule-based heuristic — not
 * a predictive model — that compares the student's profile against rough,
 * illustrative anchors for each selectivity tier and reports an unvarnished
 * estimate plus the specific weaknesses dragging it down. Every number here
 * is a starting point for a real conversation with a counselor, not a
 * guarantee.
 */

const TIER_ACT_ANCHOR: Record<SelectivityTier, number> = {
  'Extreme Reach': 34,
  Reach: 32,
  Target: 28,
  Safety: 24,
};

const TIER_GPA_ANCHOR: Record<SelectivityTier, number> = {
  'Extreme Reach': 4.3,
  Reach: 4.1,
  Target: 3.8,
  Safety: 3.4,
};

const STEM_ECON_MAJORS = ['Economics', 'Data Science', 'Environmental Science'];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function evaluateAdmissions(
  profile: StudentProfile,
  university: UniversityProfile,
  mathACTScore?: number
): AdmissionsEvaluation {
  const tier = tierFromAcceptanceRate(university.acceptanceRatePct);
  const actDelta = profile.actComposite - TIER_ACT_ANCHOR[tier];
  const gpaDelta = profile.weightedGPA - TIER_GPA_ANCHOR[tier];

  const chancePct = Math.round(clamp(university.acceptanceRatePct + actDelta * 2.5 + gpaDelta * 15, 1, 97));

  const redFlags: string[] = [];

  const avgEcImpact =
    profile.topExtracurriculars.length > 0
      ? profile.topExtracurriculars.reduce((acc, e) => acc + e.impactLevel, 0) / profile.topExtracurriculars.length
      : 0;
  if (avgEcImpact < 3) {
    redFlags.push('Extracurriculars lack demonstrable state/national impact — self-rated average is below a competitive threshold for this tier.');
  }

  const overlapsStemEcon = university.strongMajors.some((m) => STEM_ECON_MAJORS.includes(m));
  if (overlapsStemEcon && (tier === 'Extreme Reach' || tier === 'Reach') && mathACTScore !== undefined && mathACTScore < 35) {
    redFlags.push('Math ACT must hit 35+ for target STEM/Econ programs at this selectivity tier.');
  }

  if (profile.ibCourses.length < 7) {
    redFlags.push(`Only ${profile.ibCourses.length} of 7 IB courses logged — course rigor may read lighter than peers with a full diploma load.`);
  }

  if ((tier === 'Extreme Reach' || tier === 'Reach') && profile.unweightedGPA < 3.7) {
    redFlags.push('Unweighted GPA is below the typical admitted range for this tier.');
  }

  if (chancePct < 10) {
    redFlags.push('At current profile strength this is a lottery-ticket reach — apply, but do not count on it.');
  }

  return { universityId: university.id, tier, chancePct, redFlags };
}
