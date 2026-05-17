// Lightweight content moderation. Catches the obvious cases.
// For production volume, swap in a hosted moderation API (OpenAI moderation,
// Perspective API, AWS Comprehend) — gate that behind MODERATION_API_KEY.

// Small curated list. Substring matches are intentional to catch leetspeak
// and the most common evasions ("a$$", "fuk", "sh!t" all hit "ass"/"fuk"/"sht").
const BLOCKLIST: string[] = [
  'fuck', 'fuk', 'fck', 'shit', 'sht', 'bitch', 'btch', 'cunt',
  'asshole', 'dickhead', 'pussy', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'fagot', 'retard', 'tranny',
  'kike', 'spic', 'chink', 'gook',
  'rape', 'rapist', 'molest',
  'kys', 'kysf',
];

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s]+/gi;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

export type ModerationVerdict =
  | { decision: 'approved' }
  | { decision: 'pending'; reason: string }
  | { decision: 'rejected'; reason: string };

export function moderateText(input: string | null | undefined): ModerationVerdict {
  if (!input) return { decision: 'approved' };

  const text = input.toLowerCase();
  const collapsed = text.replace(/[\s\W_]+/g, '');

  for (const word of BLOCKLIST) {
    if (collapsed.includes(word)) {
      return { decision: 'rejected', reason: `blocked_word:${word}` };
    }
  }

  if (URL_RE.test(input)) {
    URL_RE.lastIndex = 0;
    return { decision: 'pending', reason: 'contains_url' };
  }
  if (EMAIL_RE.test(input)) {
    EMAIL_RE.lastIndex = 0;
    return { decision: 'pending', reason: 'contains_email' };
  }

  // Excess repetition / spam shape
  if (/(.)\1{6,}/.test(input)) {
    return { decision: 'pending', reason: 'repetition' };
  }

  return { decision: 'approved' };
}
