// Checks the config and word lists before a build. Run: npm run validate
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const cfg = JSON.parse(readFileSync(join(pub, 'config', 'app.json'), 'utf8'));
const errors = [];
const langs = cfg.translationLanguages.map((l) => l.code);
const arabicLetters = /[؀-ۿ]/;

for (const cat of cfg.wordCategories) {
  let file;
  try { file = JSON.parse(readFileSync(join(pub, cat.file), 'utf8')); } catch (e) { errors.push(`${cat.id}: cannot read ${cat.file} (${e.message})`); continue; }
  const ids = new Set();
  const want = cat.selection.mode === 'top' ? cat.selection.count : 1;
  if (file.words.length < want) errors.push(`${cat.id}: has ${file.words.length} words, config asks for ${want}`);
  file.words.forEach((w, i) => {
    const at = `${cat.id} #${i + 1} (${w.pl})`;
    if (ids.has(w.id)) errors.push(`${at}: duplicate id ${w.id}`);
    ids.add(w.id);
    if (w.rank !== i + 1) errors.push(`${at}: rank ${w.rank}, expected ${i + 1}`);
    if (!w.pl) errors.push(`${at}: missing Polish word`);
    for (const l of langs) if (!w.translations?.[l]) errors.push(`${at}: missing ${l} translation`);
    if (w.translations?.ar && !arabicLetters.test(w.translations.ar)) errors.push(`${at}: Arabic translation has no Arabic letters`);
    if (w.pos === 'noun' && !['m', 'f', 'n', 'pl'].includes(w.gender)) errors.push(`${at}: noun without gender`);
    if (w.pos === 'verb' && !w.aspect) errors.push(`${at}: verb without aspect`);
  });
  console.log(`${cat.id}: ${file.words.length} words`);
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.slice(0, 50).join('\n- ')}`);
  process.exit(1);
}
console.log('All word lists look good.');
