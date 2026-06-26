// ─── Auto-Translator for React Native ────────────────────────────────────────
// No JSON files. No keys. No i18n framework.
// Call t("Send OTP") and it auto-translates via Google Translate API.
// Results are cached in MMKV so subsequent calls are instant.
// ─────────────────────────────────────────────────────────────────────────────

import { storage } from '../utils/storage';

type Lang = 'en' | 'kn' | 'hi' | 'te';

let currentLang: Lang = 'en';

// ─── In-memory cache (on top of MMKV) ────────────────────────────────────────

const memCache: Record<string, Record<string, string>> = {};

const cacheKey = (lang: string, text: string) =>
  `gt_${lang}_${text.slice(0, 60).replace(/\s+/g, '_')}`;

const cacheGet = async (lang: string, text: string): Promise<string | null> => {
  if (memCache[lang]?.[text]) return memCache[lang][text];
  const stored = await storage.getItem(cacheKey(lang, text));
  if (stored) {
    memCache[lang] = memCache[lang] || {};
    memCache[lang][text] = stored;
    return stored;
  }
  return null;
};

const cacheSet = async (lang: string, text: string, translated: string) => {
  memCache[lang] = memCache[lang] || {};
  memCache[lang][text] = translated;
  await storage.setItem(cacheKey(lang, text), translated);
};

// ─── Google Translate API ─────────────────────────────────────────────────────

const translateOne = async (text: string, lang: string): Promise<string> => {
  if (!text.trim()) return text;
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    const data: any = await res.json();
    return (data[0] as any[][]).map((item) => item[0]).join('');
  } catch {
    return text; // fallback to English
  }
};

const translateBatch = async (texts: string[], lang: string, concurrency = 6): Promise<string[]> => {
  const results: string[] = new Array(texts.length);
  let idx = 0;

  const worker = async () => {
    while (idx < texts.length) {
      const i = idx++;
      results[i] = await translateOne(texts[i], lang);
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
};

// ─── Preload cache ────────────────────────────────────────────────────────────

/**
 * Pre-translate an array of English strings for the given language.
 * Call this on language switch so the UI is ready instantly.
 */
export const preloadTranslations = async (strings: string[], lang: Lang): Promise<void> => {
  const uncached: string[] = [];
  const uncachedIndices: number[] = [];

  for (let i = 0; i < strings.length; i++) {
    const hit = await cacheGet(lang, strings[i]);
    if (!hit) {
      uncached.push(strings[i]);
      uncachedIndices.push(i);
    }
  }

  if (!uncached.length) return;

  const translated = await translateBatch(uncached, lang);
  await Promise.all(
    uncached.map((text, j) => cacheSet(lang, text, translated[j]))
  );
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Restore saved language on app start. */
export const initLanguage = async (): Promise<void> => {
  const saved = await storage.getItem('app_language');
  if (saved === 'kn' || saved === 'hi' || saved === 'te' || saved === 'en') {
    currentLang = saved as Lang;
  }
};

// ─── Language change listeners ────────────────────────────────────────────────

type LangListener = (lang: Lang) => void;
const langListeners = new Set<LangListener>();

/** Subscribe to language changes. Returns an unsubscribe function. */
export const onLanguageChange = (cb: LangListener): (() => void) => {
  langListeners.add(cb);
  return () => langListeners.delete(cb);
};

/** Switch language and persist. */
export const changeLanguage = async (lang: Lang): Promise<void> => {
  currentLang = lang;
  await storage.setItem('app_language', lang);
  langListeners.forEach((cb) => cb(lang));
};

export const getCurrentLanguage = (): Lang => currentLang;

/**
 * Translate an English string to the current language.
 * - If current language is English, returns the string as-is (synchronous-style).
 * - If Kannada: returns cached translation instantly, or fetches and caches it.
 *
 * Usage: const label = await t("Send OTP");
 * For JSX use the `useT` hook below.
 */
export const t = async (text: string): Promise<string> => {
  if (currentLang === 'en' || !text) return text;
  const cached = await cacheGet(currentLang, text);
  if (cached) return cached;
  const translated = await translateOne(text, currentLang);
  await cacheSet(currentLang, text, translated);
  return translated;
};

/** Clear all cached translations for a language. */
export const clearTranslationCache = async (lang: Lang = 'kn'): Promise<void> => {
  delete memCache[lang];
  // Note: MMKV doesn't support prefix-delete; individual keys remain until overwritten.
};
