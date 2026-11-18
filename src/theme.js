// Mesin tema warna UKESMAS.
//
// CSS proyek ini memakai warna langsung (hex/rgb), bukan variabel CSS. Supaya file CSS
// milik anggota tim tidak perlu diubah, tema diterapkan dengan menulis ulang warna di
// stylesheet yang sudah dimuat (CSSOM) dan di inline style elemen.
// - Warna keluarga pink/mauve (warna merek) digeser ke warna tema.
// - Warna penanda (merah darurat, hijau selesai, kuning menunggu, biru info) tidak diubah.
// - Mode gelap: latar terang jadi gelap, teks gelap jadi terang.
// Elemen di dalam [data-theme-ignore] (mis. bulatan pilihan tema) tidak ikut diubah.

export const THEMES = [
  { id: 'pink', label: 'Pink', swatch: '#d77f9f' },
  { id: 'dark', label: 'Gelap', swatch: '#1c1a1b' },
  { id: 'gray', label: 'Abu-abu', swatch: '#9a9a9a' },
  { id: 'blue', label: 'Biru muda', swatch: '#79b4e3' },
  { id: 'green', label: 'Hijau muda', swatch: '#7fc79c' },
];

export const DEFAULT_THEME = 'pink';
const STORAGE_KEY = 'ukesmas-theme';
const THEME_IDS = THEMES.map((t) => t.id);

let current = DEFAULT_THEME;
const listeners = new Set();

// ---------- Konversi warna ----------

const COLOR_RE = /rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}\b|\b(?:white|black)\b/g;
const HAS_COLOR = /rgba?\(|#[0-9a-fA-F]{3,8}\b|\bwhite\b|\bblack\b/;

function parseColor(token) {
  const t = token.toLowerCase();
  if (t === 'white') return [255, 255, 255, 1];
  if (t === 'black') return [0, 0, 0, 1];
  if (t.startsWith('#')) {
    let hex = t.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('');
    if (hex.length !== 6 && hex.length !== 8) return null;
    const n = (i) => parseInt(hex.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), hex.length === 8 ? n(6) / 255 : 1];
  }
  const nums = t.match(/-?[\d.]+%?/g);
  if (!nums || nums.length < 3) return null;
  const channel = (v) => (v.endsWith('%') ? (parseFloat(v) * 255) / 100 : parseFloat(v));
  const alpha = nums[3] === undefined ? 1 : nums[3].endsWith('%') ? parseFloat(nums[3]) / 100 : parseFloat(nums[3]);
  return [channel(nums[0]), channel(nums[1]), channel(nums[2]), alpha];
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

const TEXT_PROPS = new Set(['color', 'fill', 'stroke', 'caret-color', '-webkit-text-fill-color']);

function transformColor(rgba, prop, theme) {
  const [r, g, b, a] = rgba;
  let [h, s, l] = rgbToHsl(r, g, b);
  const isBrand = s > 0.02 && h >= 285 && h <= 348;

  if (isBrand) {
    if (theme === 'blue') h = 207;
    else if (theme === 'green') {
      h = 146;
      s *= 0.8;
    } else if (theme === 'gray') s *= 0.05;
  }

  if (theme === 'dark') {
    if (TEXT_PROPS.has(prop)) {
      if (l < 0.6) l = 0.95 - l * 0.5;
    } else if (l >= 0.995) {
      l = 0.12;
      s = 0;
    } else if (l > 0.8) {
      // Latar/garis terang jadi hitam keabu-abuan (hampir netral, sedikit sisa warna).
      l = 0.07 + (1 - l) * 0.9;
      s *= 0.1;
    }
  }

  const [nr, ng, nb] = hslToRgb(h, s, l).map((v) => Math.round(Math.min(255, Math.max(0, v))));
  return a < 1 ? `rgba(${nr}, ${ng}, ${nb}, ${Math.round(a * 1000) / 1000})` : `rgb(${nr}, ${ng}, ${nb})`;
}

function transformValue(value, prop, theme) {
  if (theme === DEFAULT_THEME || value.includes('url(')) return value;
  return value.replace(COLOR_RE, (token) => {
    const rgba = parseColor(token);
    return rgba ? transformColor(rgba, prop, theme) : token;
  });
}

// ---------- Stylesheet (CSSOM) ----------

const ruleOriginals = new WeakMap(); // CSSStyleDeclaration -> Map(prop -> { value, priority })

function readOriginals(style) {
  let originals = ruleOriginals.get(style);
  if (originals) return originals;
  originals = new Map();
  for (let i = 0; i < style.length; i += 1) {
    const prop = style[i];
    const value = style.getPropertyValue(prop);
    if (HAS_COLOR.test(value)) originals.set(prop, { value, priority: style.getPropertyPriority(prop) });
  }
  ruleOriginals.set(style, originals);
  return originals;
}

function applyToDecl(style, theme) {
  for (const [prop, { value, priority }] of readOriginals(style)) {
    const next = transformValue(value, prop, theme);
    if (style.getPropertyValue(prop) !== next) style.setProperty(prop, next, priority);
  }
}

function walkRules(rules, theme) {
  for (const rule of rules) {
    if (rule.style) applyToDecl(rule.style, theme);
    if (rule.cssRules) walkRules(rule.cssRules, theme);
  }
}

function applyToStylesheets(theme) {
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules; // stylesheet beda domain (Google Fonts) tidak bisa dibaca: lewati
    } catch {
      continue;
    }
    if (rules) walkRules(rules, theme);
  }
}

// ---------- Inline style (style={{ ... }} di JSX) ----------

const inlineState = new WeakMap(); // element -> { originals: Map, applied: Map }

function applyToElement(el, theme) {
  if (!el.style || !el.style.length || el.closest('[data-theme-ignore]')) return;
  let state = inlineState.get(el);
  if (!state) {
    state = { originals: new Map(), applied: new Map() };
    inlineState.set(el, state);
  }
  for (let i = 0; i < el.style.length; i += 1) {
    const prop = el.style[i];
    const value = el.style.getPropertyValue(prop);
    // Nilai yang kita tulis sendiri: pakai nilai asli yang tersimpan. Nilai lain = nilai asli baru dari React.
    const original = state.applied.get(prop) === value ? state.originals.get(prop) : value;
    if (!HAS_COLOR.test(original)) continue;
    state.originals.set(prop, original);
    const next = transformValue(original, prop, theme);
    state.applied.set(prop, next);
    if (value !== next) el.style.setProperty(prop, next, el.style.getPropertyPriority(prop));
  }
}

function applyToInline(root, theme) {
  if (root.nodeType !== 1) return;
  if (root.hasAttribute('style')) applyToElement(root, theme);
  root.querySelectorAll('[style]').forEach((el) => applyToElement(el, theme));
}

// ---------- Terapkan & simpan ----------

function applyTheme(theme) {
  const html = document.documentElement;
  html.dataset.theme = theme;
  html.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  html.style.removeProperty('background'); // dari skrip anti-kedip di index.html; selanjutnya diatur CSS
  applyToStylesheets(theme);
  applyToInline(document.body, theme);
}

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEME_IDS.includes(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function getTheme() {
  return current;
}

export function setTheme(theme) {
  if (!THEME_IDS.includes(theme)) return;
  current = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Mode privat/penyimpanan diblokir: tema tetap berlaku sampai tab ditutup.
  }
  applyTheme(theme);
  listeners.forEach((fn) => fn(theme));
}

export function subscribeTheme(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let started = false;

export function initTheme() {
  if (started || typeof document === 'undefined') return;
  started = true;
  current = readStoredTheme();
  applyTheme(current);

  // Stylesheet baru (lazy load / hot reload saat dev) dan <link> yang baru selesai dimuat.
  const rescanSheets = () => applyToStylesheets(current);
  new MutationObserver(rescanSheets).observe(document.head, { childList: true, subtree: true, characterData: true });
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => link.addEventListener('load', rescanSheets));
  window.addEventListener('load', rescanSheets);

  // Elemen baru dan perubahan inline style dari React.
  new MutationObserver((mutations) => {
    if (current === DEFAULT_THEME) return;
    for (const m of mutations) {
      if (m.type === 'attributes') applyToElement(m.target, current);
      else m.addedNodes.forEach((node) => applyToInline(node, current));
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
}
