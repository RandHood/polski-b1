import { useState } from 'preact/hooks';
import { allAttempts, deleteAttempts, putAttempts } from '../services/db';
import { sampleAttempts } from '../services/stats';
import { readPref, writePref } from '../services/storage';
import { speak } from '../services/speech';
import type { Attempt } from '../services/types';

export function Settings() {
  const [rate, setRate] = useState(() => readPref<number>('voiceRate', 0.9));
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = async () => {
    const data = JSON.stringify({ app: 'polski-b1', exportedAt: new Date().toISOString(), attempts: await allAttempts() }, null, 2);
    const file = new File([data], `polski-b1-backup-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Polski B1 backup' });
        setMsg('Backup shared. Save it to Files to keep it.');
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg('Backup downloaded.');
  };

  const importData = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text()) as { attempts?: Attempt[] };
      const list = (parsed.attempts ?? []).filter((a) => a && a.id && a.kind && a.finishedAt);
      await putAttempts(list);
      setMsg(`Imported ${list.length} results. Results already on this phone were kept.`);
    } catch {
      setMsg('That file is not a Polski B1 backup. Choose a file made with Export backup.');
    }
  };

  return (
    <div class="stack">
      <section class="card">
        <h2 class="card__title">Pronunciation speed</h2>
        <div class="row">
          <input id="rate" type="range" min="0.5" max="1.2" step="0.1" value={rate} aria-label="Pronunciation speed"
            onInput={(e) => { const v = Number((e.currentTarget as HTMLInputElement).value); setRate(v); writePref('voiceRate', v); }} />
          <span class="mono">{rate.toFixed(1)}×</span>
          <button type="button" class="btn btn--small btn--ghost" onClick={() => speak('Dzień dobry')}>Try it</button>
        </div>
        <p class="hint">Tip: for a clearer voice, download the Enhanced Polish voice in iPhone Settings → Accessibility → Spoken Content → Voices.</p>
      </section>

      <section class="card">
        <h2 class="card__title">Backup</h2>
        <p class="hint">Your scores are saved only on this phone. Removing the app from your home screen deletes them, so export a backup now and then.</p>
        <div class="row row--wrap">
          <button type="button" class="btn" onClick={exportData}>Export backup</button>
          <label class="btn btn--ghost">Import backup<input type="file" accept="application/json,.json" hidden onChange={importData} /></label>
        </div>
      </section>

      <section class="card">
        <h2 class="card__title">Try the Statistics page</h2>
        <p class="hint">Exercises and Tests aren't built yet. Add example results to see how Statistics will look, then remove them.</p>
        <div class="row row--wrap">
          <button type="button" class="btn btn--ghost" onClick={async () => { await putAttempts(sampleAttempts()); setMsg('Example results added. Open Statistics to see them.'); }}>Add example results</button>
          <button type="button" class="btn btn--ghost" onClick={async () => { const n = await deleteAttempts((a) => !!a.sample); setMsg(`Removed ${n} example results.`); }}>Remove example results</button>
        </div>
      </section>

      <section class="card">
        <h2 class="card__title">Reset</h2>
        {!confirmReset ? (
          <button type="button" class="btn btn--danger" onClick={() => setConfirmReset(true)}>Delete all results</button>
        ) : (
          <div class="stack stack--tight">
            <p class="hint">This deletes every saved exercise and test result on this phone. It can't be undone.</p>
            <div class="row row--wrap">
              <button type="button" class="btn btn--danger" onClick={async () => { const n = await deleteAttempts(() => true); setConfirmReset(false); setMsg(`Deleted ${n} results.`); }}>Yes, delete all</button>
              <button type="button" class="btn btn--ghost" onClick={() => setConfirmReset(false)}>Keep them</button>
            </div>
          </div>
        )}
      </section>

      {msg && <p class="toast" role="status">{msg}</p>}
      <p class="hint center">Polski B1 · Version {__APP_VERSION__}</p>
    </div>
  );
}
