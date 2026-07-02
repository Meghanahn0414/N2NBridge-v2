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

// v2: bumped to invalidate any previously-cached entries where a failed
// translation attempt got stored as if it were a real translation (see
// translateOne/t below — that used to silently cache the English fallback
// on network/API errors, permanently "poisoning" the cache for that string).
const cacheKey = (lang: string, text: string) =>
  `gt_v2_${lang}_${text.slice(0, 60).replace(/\s+/g, '_')}`;

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

// Throws on any failure (network error, non-2xx, unexpected response shape)
// instead of swallowing it — callers decide how to fall back, and critically,
// a failed attempt must NOT be cached as if it were a real translation.
const translateOne = async (text: string, lang: string): Promise<string> => {
  if (!text.trim()) return text;
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translate request failed: ${res.status}`);
  const data: any = await res.json();
  const translated = (data[0] as any[][])?.map((item) => item[0]).join('');
  if (!translated) throw new Error('Translate response missing text');
  return translated;
};

// Per-item try/catch so one failure doesn't take down the whole batch. Each
// result carries an `ok` flag so callers can skip caching failed attempts —
// otherwise a single rate-limited/blocked request would permanently "poison"
// the cache with the English fallback for that string.
const translateBatch = async (
  texts: string[],
  lang: string,
  concurrency = 6,
): Promise<{ text: string; ok: boolean }[]> => {
  const results: { text: string; ok: boolean }[] = new Array(texts.length);
  let idx = 0;

  const worker = async () => {
    while (idx < texts.length) {
      const i = idx++;
      try {
        results[i] = { text: await translateOne(texts[i], lang), ok: true };
      } catch {
        results[i] = { text: texts[i], ok: false }; // fallback to English, not cached
      }
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

  for (const s of strings) {
    if (!(await cacheGet(lang, s))) uncached.push(s);
  }

  if (!uncached.length) return;

  const translated = await translateBatch(uncached, lang);
  await Promise.all(
    translated
      .map((r, j) => ({ original: uncached[j], ...r }))
      .filter((r) => r.ok)
      .map((r) => cacheSet(lang, r.original, r.text)),
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
  try {
    const translated = await translateOne(text, currentLang);
    await cacheSet(currentLang, text, translated);
    return translated;
  } catch {
    // Fall back to English WITHOUT caching — a transient network/API
    // failure must not permanently stick a string in English. The next
    // call (next render, next language switch) will simply retry.
    return text;
  }
};

/** Clear all cached translations for a language. */
export const clearTranslationCache = async (lang: Lang = 'kn'): Promise<void> => {
  delete memCache[lang];
  // Note: MMKV doesn't support prefix-delete; individual keys remain until overwritten.
};
