import { readPref } from './storage';

let voice: SpeechSynthesisVoice | null = null;

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  const prefix = lang.slice(0, 2).toLowerCase();
  const matches = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(prefix));
  // Prefer the higher-quality iOS voices when installed.
  return matches.find((v) => /enhanced|premium/i.test(v.name)) ?? matches[0] ?? null;
}

// iOS mutes speech in silent mode unless the page uses the "playback" audio category.
// Safari 17+ lets us ask for it directly; older versions switch to it while an <audio> element plays,
// so a short silent clip loops for as long as speech is playing.
let keepAlive: HTMLAudioElement | null = null;
let pauseTimer: number | undefined;
let current: SpeechSynthesisUtterance | null = null;

function silentWav(): string {
  const samples = 8000;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

function usePlaybackAudio(): void {
  try {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
    if (!keepAlive) {
      keepAlive = new Audio(silentWav());
      keepAlive.loop = true;
      keepAlive.setAttribute('playsinline', '');
    }
    clearTimeout(pauseTimer);
    void keepAlive.play().catch(() => undefined);
  } catch {
    /* not supported: speech still works when the ringer is on */
  }
}

function releasePlaybackAudio(): void {
  clearTimeout(pauseTimer);
  pauseTimer = window.setTimeout(() => keepAlive?.pause(), 1500);
}

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, lang = 'pl-PL', slow = false): void {
  if (!speechAvailable()) return;
  if (!voice) voice = pickVoice(lang);
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  if (voice) u.voice = voice;
  const rate = readPref<number>('voiceRate', 0.9);
  u.rate = slow ? Math.max(0.4, rate - 0.3) : rate;
  // Only the latest utterance may stop the silent clip; cancel() ends the previous one.
  const done = () => { if (current === u) releasePlaybackAudio(); };
  u.onend = done;
  u.onerror = done;
  current = u;
  usePlaybackAudio();
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

if (speechAvailable()) {
  speechSynthesis.addEventListener?.('voiceschanged', () => {
    voice = null;
  });
}
