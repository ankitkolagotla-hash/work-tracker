import { ColdEmailBuilderInput } from '../types/lifeOs';

/**
 * Builds a fully-interpolated cold email from the builder inputs, with two
 * independent tone axes: formality (Inquiring vs. Assertive — how the ask is
 * framed) and register (Scholarly vs. Academic — how dense the vocabulary is).
 * Deterministic string composition, not generative — the same inputs always
 * produce the same email. "[Your Name]" is left as an explicit placeholder
 * since we don't collect the student's name anywhere in this builder.
 */

function topicFor(input: ColdEmailBuilderInput): string {
  return input.category === 'Custom' ? input.customTopic.trim() || 'your research area' : input.category;
}

function introSentence(input: ColdEmailBuilderInput, topic: string): string {
  if (input.registerTone === 'Scholarly') {
    return `My name is [Your Name], and I am a high school student conducting independent research into ${topic}, with particular attention to the frameworks developed in your work${
      input.paperFocus ? `, especially ${input.paperFocus}` : ''
    }.`;
  }
  return `My name is [Your Name], a high school student researching ${topic}. I've been reading into your work${
    input.paperFocus ? `, particularly ${input.paperFocus}` : ''
  }, and wanted to reach out.`;
}

function angleSentence(input: ColdEmailBuilderInput): string {
  if (!input.studentAngle.trim()) return '';
  return input.registerTone === 'Scholarly'
    ? ` My own inquiry has centered on ${input.studentAngle.trim()}, and your work has directly informed how I've approached it.`
    : ` I've been especially focused on ${input.studentAngle.trim()}, which is part of why your work stood out to me.`;
}

function askSentence(input: ColdEmailBuilderInput): string {
  return input.formalityTone === 'Assertive'
    ? "I would appreciate the opportunity to briefly discuss this with you. Would you be available for a short 15-minute call in the coming weeks, or could you point me toward foundational readings in this area?"
    : "If you have a moment, I would love to hear your perspective on this. Would you be open to a brief 15-minute conversation, or could you suggest some readings that might deepen my understanding?";
}

export function buildColdEmail(input: ColdEmailBuilderInput): { subject: string; body: string } {
  const topic = topicFor(input);
  const subject =
    input.professorName.trim() && input.university.trim()
      ? `Prospective student interest in your research on ${topic}`
      : `Question from a high school student researching ${topic}`;

  const greeting = input.professorName.trim() ? `Dear Professor ${input.professorName.trim()},` : 'Dear Professor,';

  const body = [
    greeting,
    '',
    `${introSentence(input, topic)}${angleSentence(input)}`,
    '',
    askSentence(input),
    '',
    'Thank you for considering this — I know your time is limited.',
    '',
    'Best,',
    '[Your Name]',
  ].join('\n');

  return { subject, body };
}
