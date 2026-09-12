import { ACTDrillQuestion, ACTErrorLogEntry } from '../types/lifeOs';

/**
 * A curated bank of drill questions keyed by the same question-type tags used
 * in the error log. The adaptive engine below picks from whichever tags the
 * student is actually missing most, falling back to a mixed generic set.
 */
const DRILL_BANK: Record<string, ACTDrillQuestion[]> = {
  'Comma Splices': [
    {
      id: 'cs-1',
      questionType: 'Comma Splices',
      prompt: 'Which version is correctly punctuated?',
      options: [
        'The coach reviewed the film, the team adjusted its formation.',
        'The coach reviewed the film; the team adjusted its formation.',
        'The coach reviewed the film the team adjusted its formation.',
        'The coach reviewed the film, and, the team adjusted its formation.',
      ],
      correctIndex: 1,
    },
    {
      id: 'cs-2',
      questionType: 'Comma Splices',
      prompt: 'Which version is correctly punctuated?',
      options: [
        'She finished the draft early, she still revised it twice.',
        'She finished the draft early. She still revised it twice.',
        'She finished the draft early she still revised it twice.',
        'She finished the draft, early, she still revised it twice.',
      ],
      correctIndex: 1,
    },
  ],
  'Matrix Operations': [
    {
      id: 'mo-1',
      questionType: 'Matrix Operations',
      prompt: 'If A is a 2×3 matrix and B is a 3×2 matrix, what are the dimensions of AB?',
      options: ['2×2', '3×3', '2×3', 'Undefined'],
      correctIndex: 0,
    },
    {
      id: 'mo-2',
      questionType: 'Matrix Operations',
      prompt: 'Matrix multiplication is defined only when:',
      options: [
        'Both matrices have the same dimensions',
        'The number of columns in the first equals the number of rows in the second',
        'Both matrices are square',
        'The determinant of either matrix is nonzero',
      ],
      correctIndex: 1,
    },
  ],
  'Paired Passages': [
    {
      id: 'pp-1',
      questionType: 'Paired Passages',
      prompt: 'When two passages present differing conclusions from similar evidence, the ACT most often tests:',
      options: [
        'Which author used more citations',
        'How the authors would likely respond to each other’s central claim',
        'Which passage was published first',
        'The authors’ word choice in isolation',
      ],
      correctIndex: 1,
    },
  ],
  'Conflicting Viewpoints': [
    {
      id: 'cv-1',
      questionType: 'Conflicting Viewpoints',
      prompt: 'In a Conflicting Viewpoints science passage, the fastest way to answer a "Scientist 1 would most likely respond..." question is to:',
      options: [
        'Reread the entire passage from the start',
        'Locate that scientist’s stated hypothesis or core assumption and reason from it directly',
        'Assume the answer choice with the most technical language is correct',
        'Pick whichever viewpoint agrees with the experiment’s final result',
      ],
      correctIndex: 1,
    },
  ],
};

const GENERIC_FALLBACK: ACTDrillQuestion[] = [
  {
    id: 'gen-1',
    questionType: 'Mixed Review',
    prompt: 'Under ACT time pressure, the highest-value first move on an unfamiliar question is usually to:',
    options: [
      'Skip it and flag it for review rather than stalling',
      'Reread the full passage a second time',
      'Pick the longest answer choice',
      'Work the problem out fully before reading the choices',
    ],
    correctIndex: 0,
  },
  {
    id: 'gen-2',
    questionType: 'Mixed Review',
    prompt: 'A "trap answer" on the ACT is best described as:',
    options: [
      'The correct answer restated in harder vocabulary',
      'An answer that is true in general but does not answer the specific question asked',
      'Always the shortest option',
      'An answer with a spelling error',
    ],
    correctIndex: 1,
  },
];

/** Shuffle without mutating the input. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Ranks the student's logged error tags by frequency and assembles a drill
 * set weighted toward the weakest areas, falling back to a generic mixed
 * review when nothing has been logged yet.
 */
export function generateAdaptiveDrillSet(errorLog: ACTErrorLogEntry[], count = 5): ACTDrillQuestion[] {
  const freq = new Map<string, number>();
  errorLog.forEach((e) => freq.set(e.questionType, (freq.get(e.questionType) ?? 0) + 1));

  const rankedTags = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);

  const pool: ACTDrillQuestion[] = [];
  rankedTags.forEach((tag) => {
    if (DRILL_BANK[tag]) pool.push(...DRILL_BANK[tag]);
  });
  if (pool.length === 0) pool.push(...GENERIC_FALLBACK);

  return shuffle(pool).slice(0, count);
}

export function getKnownQuestionTypes(): string[] {
  return Object.keys(DRILL_BANK);
}
