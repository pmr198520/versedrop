// Multi-translation Bible loader.
//
// Reads `api/data/translations/_manifest.json` at startup, then each
// referenced JSON file (a flat array of verse objects). Provides:
//   - listTranslations()  — metadata for the picker UI
//   - searchVerses(query, translation)
//   - getVerse(reference, translation)
//
// Adding a translation is a data-only change — drop in the JSON file and
// update the manifest. See data/translations/README.md.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface VerseEntry {
  reference: string;
  text: string;
  book: string;
  translation: string;
}

export interface TranslationMeta {
  id: string;
  name: string;
  year?: number;
  language: string;
  license: string;
  attribution: string;
  default?: boolean;
  loaded: boolean;
  verseCount: number;
}

interface ManifestEntry {
  id: string;
  name: string;
  year?: number;
  language: string;
  license: string;
  attribution: string;
  default?: boolean;
  file: string;
}

interface RawVerse {
  ref: string;
  book: string;
  text: string;
}

// Resolve data dir from this module's location. Works for both `tsx`
// (running from src/) and compiled dist/ (where we copy data/ next to it).
//   src/bibles.ts  → src/../data/translations
//   dist/bibles.js → dist/../data/translations  (copy in Dockerfile)
function dataDir(): string {
  return resolve(__dirname, '..', 'data', 'translations');
}

const translations = new Map<string, TranslationMeta>();
const verses = new Map<string, RawVerse[]>(); // translation id → verses

let defaultTranslationId = 'KJV';

function loadAll(): void {
  const dir = dataDir();
  let manifest: { translations: ManifestEntry[] };
  try {
    manifest = JSON.parse(readFileSync(resolve(dir, '_manifest.json'), 'utf8'));
  } catch (err) {
    console.error('[bibles] Failed to load _manifest.json from', dir, err);
    return;
  }

  for (const entry of manifest.translations) {
    let loaded = false;
    let arr: RawVerse[] = [];
    try {
      arr = JSON.parse(readFileSync(resolve(dir, entry.file), 'utf8')) as RawVerse[];
      loaded = true;
    } catch (err) {
      console.warn(`[bibles] Translation ${entry.id}: failed to load ${entry.file}`, (err as Error).message);
    }
    translations.set(entry.id, {
      id: entry.id,
      name: entry.name,
      year: entry.year,
      language: entry.language,
      license: entry.license,
      attribution: entry.attribution,
      default: entry.default,
      loaded,
      verseCount: arr.length,
    });
    verses.set(entry.id, arr);
    if (entry.default) defaultTranslationId = entry.id;
  }

  const loadedIds = Array.from(translations.values()).filter((t) => t.loaded).map((t) => t.id);
  console.log(`[bibles] Loaded ${loadedIds.length} translation(s): ${loadedIds.join(', ')} (default: ${defaultTranslationId})`);
}

loadAll();

export function listTranslations(): TranslationMeta[] {
  return Array.from(translations.values());
}

export function getDefaultTranslation(): string {
  return defaultTranslationId;
}

export function isKnownTranslation(id: string): boolean {
  return translations.has(id);
}

export function getTranslationMeta(id: string): TranslationMeta | undefined {
  return translations.get(id);
}

export function searchVerses(query: string, translationId?: string): VerseEntry[] {
  const id = translationId && translations.has(translationId) ? translationId : defaultTranslationId;
  const arr = verses.get(id);
  if (!arr || arr.length === 0) {
    // If the requested translation has no data, fall back to the default
    // so users always see SOMETHING. Logged once via the loader.
    if (id !== defaultTranslationId) return searchVerses(query, defaultTranslationId);
    return [];
  }
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const scored = arr
    .map((v) => {
      const hay = `${v.ref} ${v.text} ${v.book}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (hay.includes(t)) score++;
      }
      return { v, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  return scored.map(({ v }) => ({
    reference: v.ref,
    text: v.text,
    book: v.book,
    translation: id,
  }));
}

export function getVerse(reference: string, translationId?: string): VerseEntry | undefined {
  const id = translationId && translations.has(translationId) ? translationId : defaultTranslationId;
  const arr = verses.get(id);
  const found = arr?.find((v) => v.ref === reference);
  if (!found) return undefined;
  return { reference: found.ref, text: found.text, book: found.book, translation: id };
}
