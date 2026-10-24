import { readPref } from './storage';

let voice: SpeechSynthesisVoice | null = null;

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  const prefix = lang.slice(0, 2).toLowerCase();
  const matches = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(prefix));
  // Prefer the higher-quality iOS voices when installed.
  return matches.find((v) => /enhanced|premium/i.test(v.name)) ?? matches[0] ?? null;
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
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

if (speechAvailable()) {
  speechSynthesis.addEventListener?.('voiceschanged', () => {
    voice = null;
  });
}
