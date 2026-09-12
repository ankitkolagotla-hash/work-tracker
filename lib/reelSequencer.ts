import { HighlightClip, HighlightSkill } from '../types/lifeOs';

/**
 * Deterministic, rule-based ordering of highlight clips into the three-part
 * recruiting tape structure recruiters expect: an opening Hook, a block of
 * isolated technical/tactical skill, then high-pressure game situations.
 * This is NOT an AI edit decision — it is a fixed heuristic over the tags
 * the player assigns each clip, so the same clip set always sequences the
 * same way.
 */

export const SECONDS_PER_CLIP_ESTIMATE = 12;
export const TARGET_REEL_SECONDS = 180;

const HOOK_SKILLS: HighlightSkill[] = ['Set Pieces', 'Leadership / Communication'];
const CORE_SKILL_SKILLS: HighlightSkill[] = ['Distribution / Long Passing', 'Tactical Positioning'];
const HIGH_PRESSURE_SKILLS: HighlightSkill[] = ['Transition Defense'];

export interface SequencedReel {
  hook: HighlightClip[];
  coreSkills: HighlightClip[];
  highPressure: HighlightClip[];
  estimatedSeconds: number;
  targetSeconds: number;
  overUnderSeconds: number;
}

function hasAnySkill(clip: HighlightClip, skills: HighlightSkill[]): boolean {
  return clip.skillsShown.some((s) => skills.includes(s));
}

/**
 * Arranges clips into Hook -> Core Skill Isolation -> High-Pressure Sequences.
 * The single strongest hook candidate (Set Pieces / Leadership tag) leads;
 * everything else is bucketed by tag, and untagged clips fall into whichever
 * bucket is currently shortest so the tape stays balanced.
 */
export function sequenceReel(clips: HighlightClip[]): SequencedReel {
  const hook: HighlightClip[] = [];
  const coreSkills: HighlightClip[] = [];
  const highPressure: HighlightClip[] = [];

  const hookCandidates = clips.filter((c) => hasAnySkill(c, HOOK_SKILLS));
  const leadHook = hookCandidates[0];
  if (leadHook) hook.push(leadHook);

  clips.forEach((clip) => {
    if (clip === leadHook) return;
    if (hasAnySkill(clip, CORE_SKILL_SKILLS)) {
      coreSkills.push(clip);
    } else if (hasAnySkill(clip, HIGH_PRESSURE_SKILLS)) {
      highPressure.push(clip);
    } else if (hasAnySkill(clip, HOOK_SKILLS)) {
      hook.push(clip);
    } else {
      // Untagged clip — route to whichever bucket is shortest to keep the tape balanced.
      const shortest = [
        { bucket: hook, name: 'hook' as const },
        { bucket: coreSkills, name: 'coreSkills' as const },
        { bucket: highPressure, name: 'highPressure' as const },
      ].sort((a, b) => a.bucket.length - b.bucket.length)[0];
      shortest.bucket.push(clip);
    }
  });

  const totalClips = hook.length + coreSkills.length + highPressure.length;
  const estimatedSeconds = totalClips * SECONDS_PER_CLIP_ESTIMATE;

  return {
    hook,
    coreSkills,
    highPressure,
    estimatedSeconds,
    targetSeconds: TARGET_REEL_SECONDS,
    overUnderSeconds: estimatedSeconds - TARGET_REEL_SECONDS,
  };
}
