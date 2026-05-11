import en from '../../../packages/languages/en.json';
import ht from '../../../packages/languages/ht.json';
import es from '../../../packages/languages/es.json';
import fr from '../../../packages/languages/fr.json';

export type Lang = 'en' | 'ht' | 'es' | 'fr';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ht', label: 'HT' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
];

const PACKS: Record<Lang, any> = { en, ht, es, fr };

export function pack(lang: Lang) {
  return PACKS[lang] ?? PACKS.en;
}

export function detectLang(): Lang {
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  const base = nav.slice(0, 2).toLowerCase();
  if (base === 'ht' || base === 'es' || base === 'fr') return base;
  return 'en';
}
