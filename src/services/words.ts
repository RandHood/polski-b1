import type { Selection, Word, WordCategory, WordFile } from './types';

const cache = new Map<string, Promise<Word[]>>();

/** Applies the category's selection rule from app.json to a ranked list. */
export function applySelection(words: Word[], selection: Selection): Word[] {
  const ranked = [...words].sort((a, b) => a.rank - b.rank);
  if (selection.mode === 'top') return ranked.slice(0, selection.count);
  return ranked.length < selection.threshold ? ranked : ranked.slice(0, selection.otherwiseTop);
}

export function loadWords(category: WordCategory): Promise<Word[]> {
  let p = cache.get(category.id);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}${category.file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load ${category.label} (${r.status})`);
        return r.json() as Promise<WordFile>;
      })
      .then((f) => applySelection(f.words, category.selection));
    cache.set(category.id, p);
  }
  return p;
}
