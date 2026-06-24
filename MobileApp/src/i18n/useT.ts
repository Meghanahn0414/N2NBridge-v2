// ─── useT hook ────────────────────────────────────────────────────────────────
// Drop-in replacement for the old t('key') pattern.
// Instead of t('auth.sendOtp'), just write: useT('Send OTP')
//
// Usage inside a component:
//   const tr = useT();
//   <Text>{tr('Send OTP')}</Text>          ← instant if cached
//   <Text>{tr('Phone Number')}</Text>
//
// On first render in Kannada, English text shows briefly while the translation
// loads from the API. Subsequent renders are instant from cache.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { t, getCurrentLanguage, initLanguage } from './index';
import en from './en.json';

// Resolve a dot-key like 'complaints.title' → 'My Complaints'
const lookup = (keyOrText: string): string => {
  if (!keyOrText.includes('.')) return keyOrText;
  const parts = keyOrText.split('.');
  let obj: any = en;
  for (const p of parts) {
    obj = obj?.[p];
    if (obj === undefined) return keyOrText;
  }
  return typeof obj === 'string' ? obj : keyOrText;
};

/** Hook that returns a synchronous-looking translate function for JSX.
 *  Accepts either a JSON key ('complaints.title') or raw English text. */
export const useT = () => {
  const [lang, setLang] = useState(getCurrentLanguage());
  const [, forceUpdate] = useState(0);
  const cache = useRef<Record<string, string>>({});

  useEffect(() => {
    initLanguage().then(() => setLang(getCurrentLanguage()));
  }, []);

  const tr = useCallback(
    (keyOrText: string): string => {
      const text = lookup(keyOrText); // resolve key → English
      if (!text || lang === 'en') return text;

      if (cache.current[text]) return cache.current[text];

      t(text).then((translated) => {
        if (translated !== cache.current[text]) {
          cache.current[text] = translated;
          forceUpdate((n) => n + 1);
        }
      });

      return text; // English while in-flight
    },
    [lang],
  );

  return tr;
};
