// Back-compat shim. The real implementation now lives in `src/bibles.ts`
// where it supports multiple translations. Existing imports of
// `searchVerses` from this path continue to work.

export { searchVerses } from '../bibles';
export type { VerseEntry } from '../bibles';
