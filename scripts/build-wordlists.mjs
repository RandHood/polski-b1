// Turns the compact lists in data-src/ into public/data/words/*.json.
// Run: npm run words
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'Curated by hand for B1 learners, ordered by approximate frequency in everyday Polish. To be refined against the National Corpus of Polish (NKJP) frequency list.';
const ASPECT = { i: 'imperfective', p: 'perfective', b: 'both' };

function rows(name) {
  return readFileSync(join(root, 'data-src', `${name}.txt`), 'utf8')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('|').map((c) => c.trim()));
}

function slug(s) {
  return s.toLowerCase().normalize('NFD').replace(/ł/g, 'l').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function finish(category, words) {
  const seen = new Set();
  return words.map((w, i) => {
    let id = `${category}.${slug(w.pl)}`;
    for (let n = 2; seen.has(id); n++) id = `${category}.${slug(w.pl)}-${n}`;
    seen.add(id);
    return { id, rank: i + 1, ...w };
  });
}

// Nouns and adjectives share one list; interleave them so both stay in frequency order.
function interleave(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (j >= b.length || (i < a.length && i / a.length <= j / b.length)) out.push(a[i++]);
    else out.push(b[j++]);
  }
  return out;
}

const nouns = rows('nouns').map(([pl, gender, en, ar]) => ({ pl, pos: 'noun', gender, translations: { en, ar } }));
const adjectives = rows('adjectives').map(([pl, en, ar]) => ({ pl, pos: 'adjective', translations: { en, ar } }));
const verbs = rows('verbs').map(([pl, a, pair, en, ar]) => ({
  pl, pos: 'verb', aspect: ASPECT[a], aspectPair: pair || null, translations: { en, ar },
}));
const simple = (pos) => ([pl, en, ar]) => ({ pl, pos, translations: { en, ar } });

const lists = {
  'nouns-adjectives': interleave(nouns, adjectives),
  adverbs: rows('adverbs').map(simple('adverb')),
  verbs,
  pronouns: rows('pronouns').map(simple('pronoun')),
  conjunctions: rows('conjunctions').map(simple('conjunction')),
  prepositions: rows('prepositions').map(([pl, cases, en, ar]) => ({
    pl, pos: 'preposition', governs: cases.split(',').map((c) => c.trim()), translations: { en, ar },
  })),
  interrogatives: rows('interrogatives').map(simple('question word')),
};

const out = join(root, 'public', 'data', 'words');
mkdirSync(out, { recursive: true });
for (const [category, words] of Object.entries(lists)) {
  const file = { schemaVersion: 1, category, source: SOURCE, words: finish(category, words) };
  writeFileSync(join(out, `${category}.json`), JSON.stringify(file, null, 1) + '\n');
  console.log(`${category}: ${words.length} words`);
}
