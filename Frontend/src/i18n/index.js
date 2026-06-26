// ─── Auto-Translator ─────────────────────────────────────────────────────────
// Translates the entire DOM via Google Translate API.
// No t() calls. No JSON files. No keys. Just write English in your components.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_PREFIX = 'gt_';
const ORIG = '_orig_'; // English source stored on text node
const LAST = '_last_'; // last value WE wrote — lets us detect React overwrites
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'CODE', 'PRE', 'INPUT', 'TEXTAREA', 'SELECT']);

let currentLang = sessionStorage.getItem('app_language') || 'en';
let observer = null;

// ─── In-memory + localStorage cache ──────────────────────────────────────────

const mem = {}; // { 'kn': { 'Login': 'ಲಾಗಿನ್' } }

const cacheGet = (lang, text) => {
  if (mem[lang]?.[text]) return mem[lang][text];
  try {
    const val = localStorage.getItem(CACHE_PREFIX + lang + '_' + hashText(text));
    if (val) { (mem[lang] = mem[lang] || {})[text] = val; return val; }
  } catch { /* ignore */ }
  return null;
};

const cacheSet = (lang, text, translated) => {
  (mem[lang] = mem[lang] || {})[text] = translated;
  try { localStorage.setItem(CACHE_PREFIX + lang + '_' + hashText(text), translated); } catch { /* ignore */ }
};

const hashText = (text) => {
  let h = 0;
  for (let i = 0; i < Math.min(text.length, 80); i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
};

// ─── Native numeral conversion ───────────────────────────────────────────────

const NUMERALS = {
  kn: ['೦','೧','೨','೩','೪','೫','೬','೭','೮','೯'],
  hi: ['०','१','२','३','४','५','६','७','८','९'],
  te: ['౦','౧','౨','౩','౪','౫','౬','౭','౮','౯'],
};

const toNativeNumerals = (text, lang) => {
  const digits = NUMERALS[lang];
  if (!digits) return text;
  return text.replace(/\d/g, (d) => digits[+d]);
};

const fromNativeNumerals = (text) =>
  text.replace(/[೦-೯०-९౦-౯]/g, (ch) => {
    for (const digits of Object.values(NUMERALS)) {
      const i = digits.indexOf(ch);
      if (i !== -1) return String(i);
    }
    return ch;
  });

// ─── Google Translate API (individual calls, 6 concurrent) ───────────────────

const translateOne = async (text, lang) => {
  if (!text || !text.trim()) return text;
  const cached = cacheGet(lang, text);
  if (cached) return cached;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data[0].map((item) => item[0]).join('');
    cacheSet(lang, text, translated);
    return translated;
  } catch {
    return text; // fallback to English
  }
};

const translateMany = async (texts, lang, concurrency = 6) => {
  const results = new Array(texts.length);
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

// ─── DOM helpers ──────────────────────────────────────────────────────────────

const URL_RE = /https?:\/\/\S+/;

const collectTextNodes = (root) => {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.textContent.trim();
      if (!text) return NodeFilter.FILTER_REJECT;
      if (URL_RE.test(text)) return NodeFilter.FILTER_REJECT; // skip text with URLs
      const p = node.parentElement;
      if (!p || SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.closest('[data-notranslate]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
};

const applyTranslations = async (nodes, lang) => {
  if (!nodes.length) return;

  if (lang === 'en') {
    for (const n of nodes) { if (n[ORIG]) n.textContent = n[ORIG]; }
    return;
  }

  const uncachedTexts = [];
  const uncachedNodes = [];

  for (const n of nodes) {
    const currentText = n.textContent.trim();

    // If React has overwritten what we last set (e.g. "—" → "19" when data loads),
    // discard the stale stored original so we re-derive from the new content.
    if (n[LAST] !== undefined && n[LAST] !== currentText) {
      delete n[ORIG];
    }

    const raw = n[ORIG] || currentText;
    n[ORIG] = raw;

    const hit = cacheGet(lang, raw);
    if (hit) {
      n.textContent = hit;
      n[LAST] = hit;
    } else {
      uncachedTexts.push(raw);
      uncachedNodes.push(n);
    }
  }

  if (!uncachedTexts.length) return;

  const translated = await translateMany(uncachedTexts, lang);
  uncachedNodes.forEach((n, i) => {
    n.textContent = translated[i];
    n[LAST] = translated[i];
  });
};

// ─── Full-page translation ────────────────────────────────────────────────────

const doTranslate = async (lang) => {
  const nodes = collectTextNodes(document.body);
  await applyTranslations(nodes, lang);
};

// After React re-renders (state updates from language toggle), DOM resets.
// Re-translate a few times to stay ahead of React's reconciliation.
const scheduleRetranslate = (lang) => {
  [30, 150, 400, 800].forEach((ms) =>
    setTimeout(() => { if (currentLang === lang) doTranslate(lang); }, ms),
  );
};

// ─── MutationObserver — handles dynamic content & React re-renders ────────────

let pending = false;

const isInputFocused = () => {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

const isInputNode = (node) => {
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
};

const startObserver = () => {
  if (observer) observer.disconnect();
  observer = new MutationObserver((mutations) => {
    if (currentLang === 'en' || pending || isInputFocused()) return;

    // Skip batches where every mutation touches an input/textarea —
    // those are keystrokes, not data loads. This avoids the getSelection crash
    // that characterData:true caused when React processed input events.
    const allInputMutations = mutations.every((m) => isInputNode(m.target));
    if (allInputMutations) return;

    pending = true;
    requestAnimationFrame(async () => {
      await doTranslate(currentLang);
      pending = false;
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true, // needed to catch React text-node updates (e.g. "—" → "19")
  });
};

const pauseObserver = () => observer?.disconnect();
const resumeObserver = () => startObserver();

// ─── Navigation hook — re-translate after React Router page changes ───────────
// React Router calls history.pushState/replaceState on navigation.
// The new page DOM is rendered async, so we re-translate at a few intervals.

const onNavigation = () => {
  if (currentLang === 'en') return;
  [100, 400, 900].forEach((ms) =>
    setTimeout(() => { if (currentLang !== 'en') doTranslate(currentLang); }, ms),
  );
};

const hookNavigation = () => {
  const wrap = (fn) =>
    function (...args) {
      fn.apply(history, args);
      onNavigation();
    };
  history.pushState    = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
  window.addEventListener('popstate', onNavigation);
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const initLanguage = async () => {
  const saved = sessionStorage.getItem('app_language') || 'en';
  currentLang = saved;
  // Wait for React to finish first render
  if (saved !== 'en') {
    await new Promise((r) => setTimeout(r, 100));
    await doTranslate(saved);
  }
  hookNavigation();
  startObserver();
};

export const changeLanguage = async (lang) => {
  currentLang = lang;
  sessionStorage.setItem('app_language', lang);

  // Pause observer so it doesn't fight us during bulk translation
  pauseObserver();
  await doTranslate(lang);
  resumeObserver();

  // Re-translate after React flushes its pending state updates
  scheduleRetranslate(lang);
};

export const clearTranslationCache = (lang = 'kn') => {
  delete mem[lang];
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(CACHE_PREFIX + lang)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
};

export const getCurrentLanguage = () => currentLang;

export default { initLanguage, changeLanguage, clearTranslationCache, getCurrentLanguage };
