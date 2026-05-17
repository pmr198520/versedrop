# Bible Translations

This folder holds the verse data for every translation VerseDrop supports. The runtime [bibles.ts](../../src/bibles.ts) loader reads `_manifest.json` and the per-translation files at startup.

## File format

Each translation is a single JSON array of verse objects:

```json
[
  { "ref": "Genesis 1:1", "book": "Genesis", "text": "In the beginning..." },
  { "ref": "John 3:16",  "book": "John",    "text": "For God so loved..." }
]
```

That's it — no nested objects, no chapter wrappers. `ref` is the canonical reference string used everywhere in the app (display, lookup, drop storage).

## What's shipped today

| ID | File | Coverage | License |
|---|---|---|---|
| KJV | [kjv.json](./kjv.json) | ~85 curated popular verses | Public domain (Crown copyright in UK) |
| WEB | [web.json](./web.json) | ~25 sample verses | Public domain (CC0) |
| ASV | [asv.json](./asv.json) | Empty stub | Public domain |
| BSB | [bsb.json](./bsb.json) | Empty stub | Public domain |

The shipped data is enough for the existing demo to work and for product reviewers to see multi-translation UX. **Before production launch, replace these with full Bibles.** Sources below.

## Where to download full Bibles

### KJV / ASV / WEB / BBE / YLT / Darby (all public domain)

- **scrollmapper/bible_databases** — https://github.com/scrollmapper/bible_databases
  - Pre-extracted in many formats (JSON, MySQL, SQLite). `json/` folder has each translation as one file per book. You'll want to flatten them into our single-array format.
- **aruljohn/Bible-kjv** — https://github.com/aruljohn/Bible-kjv (clean KJV JSON, one file per book)

### Berean Standard Bible (BSB)

- Download the canonical TSV at **https://bereanbible.com** (right column, "Translation Tables")
- Convert to the JSON format above. Use any reference that includes book/chapter/verse columns.

### Conversion script template

If you download a per-book or per-chapter source, convert to our flat format with something like:

```js
// scripts/convert-translation.mjs — run from versedrop/api/
import fs from 'node:fs/promises';

const SOURCE_DIR = './source-kjv';   // adjust to where you downloaded
const OUTPUT     = './data/translations/kjv.json';

const books = await fs.readdir(SOURCE_DIR);
const all = [];
for (const file of books) {
  const data = JSON.parse(await fs.readFile(`${SOURCE_DIR}/${file}`, 'utf8'));
  // assumes each file is { book: 'Genesis', chapters: [{ chapter: 1, verses: [{ verse: 1, text: '...' }] }] }
  for (const ch of data.chapters) {
    for (const v of ch.verses) {
      all.push({
        ref:  `${data.book} ${ch.chapter}:${v.verse}`,
        book: data.book,
        text: v.text,
      });
    }
  }
}
await fs.writeFile(OUTPUT, JSON.stringify(all, null, 0));
console.log(`Wrote ${all.length} verses to ${OUTPUT}`);
```

The output should be `JSON.stringify(all)` (no indent) for size. A full Bible is ~31,100 verses.

## Adding a new translation

1. Add an entry to [_manifest.json](./_manifest.json) with `id`, `name`, `language`, `license`, `attribution`, and `file`.
2. Drop the JSON file at the path you specified.
3. Restart the API. The loader logs each translation as it loads.

That's all — no code changes needed. The mobile picker and search route pick up the new translation automatically.

## Licensed translations (NIV, ESV, NLT, NASB, CSB, NKJV, The Message...)

These require **separate written licenses** from the publishers (Zondervan, Crossway, Tyndale, Lockman, Holman, Thomas Nelson, NavPress). Royalty rates vary; some require fixed annual fees plus per-use charges; some won't license at all for new apps.

When you have a license, the cleanest path is:

- Sign up at [API.Bible](https://scripture.api.bible/) (American Bible Society) — they handle the technical hosting for many publishers
- OR negotiate direct API access with the publisher
- Add a per-translation `source: 'apiBible'` field to the manifest, and update `bibles.ts` to lazy-fetch via the API instead of from disk

Until you have a license for a given translation, do **not** add it to `_manifest.json` — there is no fair-use path for distributing the full text in your app.

## Crown Copyright on KJV (UK only)

The KJV is public domain in the US and most of the world. In the UK, the Crown holds perpetual copyright (Cambridge University Press and Oxford University Press are the authorized printers). Practically: digital apps quoting KJV in the UK rarely get any enforcement action, but if you want to be fully clean for UK distribution, you can:

1. Remove KJV from `_manifest.json` and ship WEB / BSB / ASV instead (modern, fully PD worldwide), OR
2. Request a license from Cambridge University Press (free for most non-commercial educational use).
