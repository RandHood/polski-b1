export type NavStatus = 'active' | 'construction';

export interface NavPage { id: string; label: string; description?: string; status: NavStatus }
export interface NavItem { id: string; label: string; icon: string; status: NavStatus; pages?: NavPage[] }

export interface Language { code: string; label: string; nativeLabel: string; dir: 'ltr' | 'rtl' }

export type Selection =
  | { mode: 'top'; count: number }
  | { mode: 'allIfUnder'; threshold: number; otherwiseTop: number };

export interface WordCategory { id: string; label: string; file: string; selection: Selection }

export interface TestSection { id: string; label: string; autoScored: boolean }

export interface StatRange { id: string; label: string; days: number }

export interface AppConfig {
  schemaVersion: number;
  appName: string;
  navigation: NavItem[];
  translationLanguages: Language[];
  defaults: { translationLanguage: string; direction: Direction; wordCategory: string };
  speech: { lang: string; rate: number; slowRate: number };
  wordCategories: WordCategory[];
  tests: { passThresholdPercent: number; passRule: 'everySection' | 'average'; sections: TestSection[] };
  statistics: { ranges: StatRange[]; defaultRange: string; recentAttempts: number };
}

export type Direction = 'pl-to-translation' | 'translation-to-pl';

export interface Word {
  id: string;
  rank: number;
  pl: string;
  pos: string;
  translations: Record<string, string>;
  gender?: 'm' | 'f' | 'n' | 'pl';
  aspect?: 'imperfective' | 'perfective' | 'both';
  aspectPair?: string | null;
  governs?: string[];
}

export interface WordFile { schemaVersion: number; category: string; source: string; words: Word[] }

export interface SectionScore { id: string; correct: number; total: number; percent: number; passed: boolean }

export interface Attempt {
  id: string;
  schemaVersion: 1;
  kind: 'exercise' | 'test';
  topic: string;
  startedAt: string;
  finishedAt: string;
  correct: number;
  total: number;
  percent: number;
  sections?: SectionScore[];
  passThresholdPercent?: number;
  passed?: boolean;
  answers?: { questionId: string; given: string; correct: boolean }[];
  sample?: boolean;
}
