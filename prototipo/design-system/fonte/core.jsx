import { LOGO_FULL, LOGO_FULL_NEG, LOGO_SYMBOL } from './assets.js';
import React, { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, useLayoutEffect } from 'react';

/* ---------- utilidades ---------- */
export const cx = (...a) => a.filter(Boolean).join(' ');
let _uid = 0;
export const useUid = (prefix = 'pt') => {
  const r = useRef(null);
  if (r.current === null) r.current = `${prefix}-${++_uid}`;
  return r.current;
};
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  const html = document.documentElement;
  if (html.getAttribute('data-motion') === 'reduzido') return true;
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
};
export const useReducedMotion = () => {
  const [r, setR] = useState(prefersReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const update = () => setR(prefersReducedMotion());
    mq && mq.addEventListener && mq.addEventListener('change', update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    return () => { mq && mq.removeEventListener && mq.removeEventListener('change', update); mo.disconnect(); };
  }, []);
  return r;
};
export const useCountUp = (value, duration = 700) => {
  const reduced = useReducedMotion();
  const [v, setV] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) { setV(value); return; }
    let raf; const start = performance.now(); const from = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from + (value - from) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced, duration]);
  return v;
};
export const brl = (n, opts = {}) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', ...opts });
export const num = (n, d = 0) => (n ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const useOnClickOutside = (ref, handler, active = true) => {
  useEffect(() => {
    if (!active) return;
    const f = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(e); };
    document.addEventListener('pointerdown', f);
    return () => document.removeEventListener('pointerdown', f);
  }, [ref, handler, active]);
};

/* ---------- ícones (traço 1.75, 24px, cantos redondos) ---------- */
const I = {
  home: ['M3.5 10.5 12 3.5l8.5 7', 'M5.5 9v11h13V9', 'M10 20v-5.5h4V20'],
  calendar: [{ r: [3.5, 5, 17, 15.5, 2.5] }, 'M3.5 9.5h17', 'M8 3v4', 'M16 3v4'],
  bell: ['M6.5 16v-4.5a5.5 5.5 0 0 1 11 0V16l1.5 2h-14z', 'M10 20.5a2 2 0 0 0 4 0'],
  chat: ['M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-5.5 4v-4H4.5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z'],
  wallet: [{ r: [3, 6, 18, 13.5, 2.5] }, 'M3 10h18', 'M16 14.75h2'],
  book: ['M4 4.5h5.5a2.5 2.5 0 0 1 2.5 2.5v13a2 2 0 0 0-2-2H4z', 'M20 4.5h-5.5A2.5 2.5 0 0 0 12 7v13a2 2 0 0 1 2-2h6z'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  'check-circle': [{ c: [12, 12, 9] }, 'M8 12.25l2.75 2.75L16 9.5'],
  alert: ['M12 3.75 21.25 19.5H2.75z', 'M12 10v4.25', 'M12 17.25v.25'],
  info: [{ c: [12, 12, 9] }, 'M12 11v5.25', 'M12 7.75v.25'],
  x: ['M6 6l12 12', 'M18 6 6 18'],
  'x-circle': [{ c: [12, 12, 9] }, 'M9.25 9.25l5.5 5.5', 'M14.75 9.25l-5.5 5.5'],
  'chevron-right': ['M9.5 5.5 16 12l-6.5 6.5'],
  'chevron-left': ['M14.5 5.5 8 12l6.5 6.5'],
  'chevron-down': ['M5.5 9.5 12 16l6.5-6.5'],
  'chevron-up': ['M5.5 14.5 12 8l6.5 6.5'],
  'arrow-right': ['M4.5 12h15', 'M13.5 6l6 6-6 6'],
  'arrow-left': ['M19.5 12h-15', 'M10.5 6l-6 6 6 6'],
  'arrow-up-right': ['M7 17 17 7', 'M8.5 7H17v8.5'],
  'arrow-down-right': ['M7 7l10 10', 'M17 8.5V17H8.5'],
  search: [{ c: [11, 11, 6.75] }, 'M16 16l4.5 4.5'],
  user: [{ c: [12, 8, 4] }, 'M4.5 20.5a7.5 7.5 0 0 1 15 0'],
  users: [{ c: [9, 8.5, 3.5] }, 'M2.75 20a6.25 6.25 0 0 1 12.5 0', 'M15.5 5a3.5 3.5 0 0 1 0 7', 'M17.75 14.25A6.25 6.25 0 0 1 21.25 20'],
  sliders: ['M4 6.5h9', 'M17 6.5h3', 'M4 12h3', 'M11 12h9', 'M4 17.5h11', 'M19 17.5h1', { c: [15, 6.5, 2] }, { c: [9, 12, 2] }, { c: [17, 17.5, 2] }],
  logout: ['M14.5 4h4a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-4', 'M9.5 8 5.5 12l4 4', 'M5.5 12h10'],
  eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', { c: [12, 12, 3] }],
  download: ['M12 4v11', 'M7.5 10.5 12 15l4.5-4.5', 'M5 19.5h14'],
  upload: ['M12 15V4', 'M7.5 8.5 12 4l4.5 4.5', 'M5 19.5h14'],
  clock: [{ c: [12, 12, 9] }, 'M12 7.25V12l3 2'],
  pin: ['M12 21s6.75-6.1 6.75-11.5a6.75 6.75 0 0 0-13.5 0C5.25 14.9 12 21 12 21z', { c: [12, 9.5, 2.4] }],
  camera: [{ r: [3, 7, 18, 13, 2.5] }, 'M8.5 7l1.5-2.5h4L15.5 7', { c: [12, 13.5, 3.5] }],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  filter: ['M4 5h16l-6 7.5V19l-4 1.5v-8z'],
  more: ['M6 12h.01', 'M12 12h.01', 'M18 12h.01'],
  volume: ['M4 9.5h3.5L12 5.5v13l-4.5-4H4z', 'M15.75 9.25a3.75 3.75 0 0 1 0 5.5', 'M18.25 6.75a7.25 7.25 0 0 1 0 10.5'],
  translate: ['M3.5 5.5h9', 'M8 3.5v2', 'M5.75 5.5c.6 3 2.6 5.75 6 7.25', 'M10.25 5.5c-.6 3-2.6 5.75-6 7.25', 'M13 20.5l4-9 4 9', 'M14.4 17.5h5.2'],
  hand: ['M8 12.5V6a1.5 1.5 0 0 1 3 0v5', 'M11 10.5V4.5a1.5 1.5 0 0 1 3 0v6', 'M14 10.5V6a1.5 1.5 0 0 1 3 0v6', 'M17 11.5a1.5 1.5 0 0 1 3 0v2.75A6.75 6.75 0 0 1 13.25 21h-.75a6 6 0 0 1-5-2.7L4.6 14.4a1.5 1.5 0 0 1 2.3-1.9L8 14'],
  file: ['M6.5 3h7.5l4.5 4.5V21h-12z', 'M14 3v4.5h4.5'],
  'file-text': ['M6.5 3h7.5l4.5 4.5V21h-12z', 'M14 3v4.5h4.5', 'M9 12.5h6', 'M9 16.5h4.5'],
  sun: [{ c: [12, 12, 4] }, 'M12 2.5v2', 'M12 19.5v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2.5 12h2', 'M19.5 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
  moon: ['M19.5 14.5A7.75 7.75 0 1 1 9.5 4.5a6.25 6.25 0 0 0 10 10z'],
  'text-size': ['M3.5 18.5 8.25 6l4.75 12.5', 'M5.1 14.25h6.3', 'M14.5 18.5l3-7.75 3 7.75', 'M15.6 15.75h3.8'],
  accessibility: [{ c: [12, 4.75, 1.75] }, 'M5 8.75l7 1.5 7-1.5', 'M12 10.25V15', 'M9 21l3-6 3 6'],
  lock: [{ r: [5, 10.5, 14, 10, 2] }, 'M8 10.5V7.5a4 4 0 0 1 8 0v3'],
  mail: [{ r: [3, 5, 18, 14, 2.5] }, 'M3.75 6.75 12 13l8.25-6.25'],
  phone: ['M5 4h3.25l1.5 4-2 1.5a11 11 0 0 0 6.75 6.75l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 5.5 1.5 1.5 0 0 1 5 4z'],
  school: ['M3 20.5h18', 'M5 20.5V10l7-4 7 4v10.5', 'M10 20.5v-5h4v5', 'M12 6V2.75h3.5'],
  chart: ['M3.5 20h17', 'M7 20v-6', 'M12 20V7', 'M17 20v-9.5'],
  list: ['M9 6.5h11', 'M9 12h11', 'M9 17.5h11', 'M4.5 6.5h.01', 'M4.5 12h.01', 'M4.5 17.5h.01'],
  grid: [{ r: [4, 4, 6.5, 6.5, 1.5] }, { r: [13.5, 4, 6.5, 6.5, 1.5] }, { r: [4, 13.5, 6.5, 6.5, 1.5] }, { r: [13.5, 13.5, 6.5, 6.5, 1.5] }],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
  trash: ['M4 7h16', 'M9.5 7V4.5h5V7', 'M6.5 7l1 13h9l1-13', 'M10 11v5', 'M14 11v5'],
  paperclip: ['M19.5 11.5l-7.75 7.75a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.6 16.75a1.6 1.6 0 0 1-2.3-2.3L15 6.75'],
  send: ['M3.5 11.5 20.5 4l-6.5 16.5-3-6.5z', 'M11 14l9.5-10'],
  qr: [{ r: [3.5, 3.5, 6.5, 6.5, 1] }, { r: [14, 3.5, 6.5, 6.5, 1] }, { r: [3.5, 14, 6.5, 6.5, 1] }, 'M14 14h2.5v2.5H14z', 'M20.5 14v.01', 'M18.25 18.25h2.25v2.25', 'M14 20.5h.01'],
  copy: [{ r: [8.5, 8.5, 12, 12, 2] }, 'M15.5 8.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5'],
  card: [{ r: [2.5, 5, 19, 14, 2.5] }, 'M2.5 9.75h19', 'M6 15h4'],
  barcode: ['M4 5v14', 'M7 5v14', 'M9.5 5v14', 'M13 5v14', 'M15.5 5v14', 'M18 5v14', 'M20.5 5v14'],
  bus: [{ r: [4.5, 3.5, 15, 14, 2.5] }, 'M4.5 11h15', 'M7.5 20.5v-3', 'M16.5 20.5v-3', 'M8 14.25h.01', 'M16 14.25h.01'],
  utensils: ['M7 3v7.5a2 2 0 0 0 2 2V21', 'M5 3v5.5', 'M9 3v5.5', 'M17 21V3c-2 1.5-3 4-3 7.5h3'],
  bed: ['M3 18.5V6.5', 'M3 13h18v5.5', 'M21 13a3 3 0 0 0-3-3h-8v3', { c: [6.75, 10.25, 1.75] }],
  image: [{ r: [3, 4, 18, 16, 2.5] }, { c: [9, 9.5, 1.75] }, 'M21 15.5l-5-5L6.5 20'],
  star: ['M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z'],
  walk: [{ c: [13, 4.25, 1.75] }, 'M10 21l2-6 3 3v3', 'M12 15l1-5 2.5 2.75H19', 'M13 10l-3-1-3 3'],
  flag: ['M5 21V4', 'M5 4.5h11.5l-2 4 2 4H5'],
  refresh: ['M19.5 11a7.5 7.5 0 1 0-2.2 5.3', 'M19.5 4.5V11H13'],
  'wifi-off': ['M3.5 3.5l17 17', 'M8.75 16.25a4.6 4.6 0 0 1 6.5 0', 'M5.25 12.75a9.5 9.5 0 0 1 4.25-2.3', 'M14.5 10.45a9.5 9.5 0 0 1 4.25 2.3', 'M2.25 9.25a14.5 14.5 0 0 1 4-2.5', 'M10.25 5.6a14.5 14.5 0 0 1 11.5 3.65', 'M12 19.75h.01'],
  menu: ['M4 6.5h16', 'M4 12h16', 'M4 17.5h16'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5H10'],
  shield: ['M12 3.25 19.5 6v5.75c0 4.4-3.25 7.9-7.5 9-4.25-1.1-7.5-4.6-7.5-9V6z', 'M9 12l2 2 4-4'],
  palette: ['M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 2-2s-.9-1.5-.9-2.4.6-1.6 1.6-1.6h2.1a3.7 3.7 0 0 0 3.7-3.7c0-4.1-3.8-7.3-8.5-7.3z', 'M7.5 11.5h.01', 'M9.75 7.75h.01', 'M14.25 7.75h.01'],
  modules: [{ r: [4, 4, 7, 7, 1.5] }, { r: [13, 4, 7, 7, 1.5] }, { r: [4, 13, 7, 7, 1.5] }, 'M16.5 13v7', 'M13 16.5h7'],
  key: [{ c: [8, 15.5, 4] }, 'M10.9 12.6 19.5 4', 'M16.5 7l2.25 2.25', 'M14.25 9.25l2 2'],
  graduation: ['M2.5 9.5 12 5l9.5 4.5L12 14z', 'M6.5 11.5v4.25c0 1.5 2.75 3 5.5 3s5.5-1.5 5.5-3V11.5', 'M21.5 9.5v5'],
  pulse: ['M3 12h4l2.25-5 3.5 10 2.25-5h6'],
  play: ['M7 4.75v14.5L19 12z'],
  pause: ['M8 5v14', 'M16 5v14'],
  target: [{ c: [12, 12, 8.5] }, { c: [12, 12, 4] }, 'M12 12h.01'],
  'line-height': ['M7 4.5v15', 'M4.5 7 7 4.5 9.5 7', 'M4.5 17 7 19.5 9.5 17', 'M13 7.5h7', 'M13 12h7', 'M13 16.5h7'],
  contrast: [{ c: [12, 12, 8.5] }, { f: 'M12 3.5a8.5 8.5 0 0 1 0 17z' }],
  wave: ['M3 12c1.75-3.5 3.5-3.5 5.25 0s3.5 3.5 5.25 0 3.5-3.5 5.25 0 1.75 2.5 2.25 2.5'],
  'text-simple': ['M5 7h14', 'M5 12h10', 'M5 17h6'],
  sparkline: ['M3 17l4.5-5 3.5 3 4-7 3.5 4 2.5-2.5'],
  door: ['M5 20.5h14', 'M7 20.5V4h10v16.5', 'M14 12.5h.01'],
  video: [{ r: [3, 6.5, 12, 11, 2.5] }, 'M15 10.5l5.5-3v9l-5.5-3z'],
  bookmark: ['M6.5 3.5h11v17L12 16.5l-5.5 4z'],
  receipt: ['M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5L6 20.5z', 'M9 8h6', 'M9 11.5h6', 'M9 15h3.5'],
  clipboard: [{ r: [5, 4.5, 14, 16.5, 2.5] }, { r: [9, 3, 6, 3.5, 1.2] }, 'M8.5 11h7', 'M8.5 15h5'],
  gate: ['M3.5 20.5V8l8.5-4.5L20.5 8v12.5', 'M7.5 20.5v-8h9v8', 'M10.5 12.5v8', 'M13.5 12.5v8'],
  scan: ['M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8', 'M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8', 'M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16', 'M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16', 'M4 12h16'],
  'sun-moon': [{ c: [9, 9, 3.5] }, 'M9 2.5v1.5', 'M2.5 9H4', 'M4.4 4.4l1 1', 'M15.5 13.5a4.5 4.5 0 1 0 5 5 3.5 3.5 0 0 1-5-5z'],
  tag: ['M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8-9.1 9.1z', 'M8.25 8.25h.01'],
  heart: ['M12 20s-7.5-4.6-7.5-10A4.25 4.25 0 0 1 12 7.5 4.25 4.25 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z'],
  sync: ['M4.5 9.5A7.5 7.5 0 0 1 18 7.25', 'M18.5 3.5v4h-4', 'M19.5 14.5A7.5 7.5 0 0 1 6 16.75', 'M5.5 20.5v-4h4'],
  history: ['M4 12a8 8 0 1 0 2.4-5.7', 'M4 4v4.25h4.25', 'M12 8v4.25l3 1.75'],
  'help': [{ c: [12, 12, 9] }, 'M9.6 9.4a2.5 2.5 0 0 1 4.85.85c0 1.75-2.45 2.2-2.45 3.75', 'M12 17.1v.25'],
  baby: [{ c: [12, 12.5, 7.5] }, 'M9.5 12h.01', 'M14.5 12h.01', 'M10 15.25a3 3 0 0 0 4 0', 'M12 5a2 2 0 0 0 2-2'],
  kbd: [{ r: [3, 6, 18, 12, 2.5] }, 'M7 10h.01', 'M10.5 10h.01', 'M14 10h.01', 'M17.5 10h.01', 'M8 14h8'],
};
export const iconNames = Object.keys(I);

export function Icon({ name, size = 20, className, label, strokeWidth = 1.75, style }) {
  const parts = I[name] || I.help;
  return (
    <svg className={cx('rc-icon', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined} aria-label={label} focusable="false" style={style}>
      {parts.map((p, i) => {
        if (typeof p === 'string') return <path key={i} d={p} />;
        if (p.c) return <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.c[2]} />;
        if (p.r) return <rect key={i} x={p.r[0]} y={p.r[1]} width={p.r[2]} height={p.r[3]} rx={p.r[4] || 0} />;
        if (p.f) return <path key={i} d={p.f} fill="currentColor" stroke="none" />;
        return null;
      })}
    </svg>
  );
}

/* ---------- marca ---------- */
/** Símbolo do Recreio Sistema Educacional (o R com as três peças). Imagem fiel ao arquivo da marca. */
export function LogoMark({ size = 32, className, title = 'Recreio Sistema Educacional' }) {
  return <img className={cx('rc-logomark', className)} src={LOGO_SYMBOL} width={size} height={size} alt={title} draggable="false" />;
}
/** Logo do produto. full: símbolo, nome e slogan (arquivo da marca). inline: símbolo e o nome em texto, para barras e rodapés. */
export function Logo({ variant = 'inline', size = 28, tone = 'auto', className }) {
  const mode = useThemeMode();
  const neg = tone === 'negativo' || (tone === 'auto' && (mode === 'escuro' || mode === 'alto-contraste-escuro'));
  if (variant === 'full') {
    return <img className={cx('rc-logo-full', className)} src={neg ? LOGO_FULL_NEG : LOGO_FULL} alt="Recreio Sistema Educacional. Toda a escola. Em um só lugar." style={{ height: size }} draggable="false" />;
  }
  return (
    <span className={cx('rc-logo', neg && 'is-neg', className)} style={{ '--logo-size': `${size}px` }}>
      <LogoMark size={size} title="" />
      <span className="rc-logo-word"><small>Sistema</small>Recreio</span>
    </span>
  );
}
export function SchoolMark({ name = 'Escola', src, size = 36, className }) {
  const initials = name.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return src
    ? <img className={cx('rc-schoolmark', className)} src={src} alt={name} width={size} height={size} />
    : <span className={cx('rc-schoolmark', className)} style={{ width: size, height: size, fontSize: size * 0.36 }} aria-label={name} role="img">{initials}</span>;
}
/** Crédito do produto em texto simples, nunca a logo. */
export function MadeBy({ className, product = 'Recreio Sistema Educacional' }) {
  return <p className={cx('rc-madeby', className)}>Feito por {product}</p>;
}

/* ---------- cor da escola (white label) ---------- */
const hexToRgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const fromLin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const rgbToHex = (rgb) => '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
export const luminance = (hex) => { const [r, g, b] = hexToRgb(hex).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const toOklch = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.sqrt(A * A + B * B), Math.atan2(B, A)];
};
const oklchRgb = (L, C, h) => {
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
};
const tone = (L, C, h) => {
  let lo = 0, hi = C, rgb = oklchRgb(L, C, h);
  const ok = (v) => v.every((c) => c >= -0.0005 && c <= 1.0005);
  if (!ok(rgb)) { for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (ok(oklchRgb(L, mid, h))) lo = mid; else hi = mid; } rgb = oklchRgb(L, lo, h); }
  return rgbToHex(rgb.map(fromLin));
};
const GROUNDS = {
  claro: { s0: '#EEF3FA', s1: '#FFFFFF', alt: '#EEF4FD', ink: '#0A1A3A', min: 4.5 },
  escuro: { s0: '#06122B', s1: '#0C1B3B', alt: '#10224A', ink: '#EEF3FC', min: 4.5 },
  'alto-contraste': { s0: '#FFFFFF', s1: '#FFFFFF', alt: '#EDF1F7', ink: '#000000', min: 7 },
  'alto-contraste-escuro': { s0: '#000000', s1: '#050A15', alt: '#0B1324', ink: '#FFFFFF', min: 7 },
};
/** Gera brand, brand-strong, brand-soft, on-brand, brand-ink e a navegação (nav) a partir da cor da escola, garantindo contraste. */
export function schoolPalette(seed = '#0067CC', mode = 'claro') {
  const g = GROUNDS[mode] || GROUNDS.claro;
  const dark = mode === 'escuro' || mode === 'alto-contraste-escuro';
  const [L0, C0, h] = toOklch(seed);
  const notes = [];
  const walk = (start, dir, test) => { let L = start; for (let i = 0; i < 100 && !test(L); i++) L += dir * 0.01; return Math.min(0.99, Math.max(0.02, L)); };
  let brand, onBrand;
  if (!dark) {
    const white = '#FFFFFF';
    if (contrast(seed, white) >= g.min) { brand = seed.toUpperCase(); onBrand = white; }
    else if (mode === 'claro' && contrast(seed, g.ink) >= g.min && L0 > 0.72) { brand = seed.toUpperCase(); onBrand = g.ink; }
    else {
      const L = walk(L0, -1, (x) => contrast(tone(x, C0, h), white) >= g.min);
      brand = tone(L, C0, h); onBrand = white;
      notes.push({ token: 'brand', from: seed.toUpperCase(), to: brand, reason: `escurecida para o texto branco passar ${g.min}:1` });
    }
  } else {
    const L = walk(Math.max(L0, 0.72), 1, (x) => contrast(tone(x, Math.min(C0, 0.14), h), g.s0) >= g.min && contrast(tone(x, Math.min(C0, 0.14), h), '#0C0C0B') >= g.min);
    brand = tone(L, Math.min(C0, 0.14), h); onBrand = mode === 'escuro' ? tone(0.2, Math.min(C0, 0.04), h) : '#000000';
    if (contrast(brand, onBrand) < g.min) onBrand = '#000000';
    notes.push({ token: 'brand', from: seed.toUpperCase(), to: brand, reason: 'clareada para o tema escuro' });
  }
  const [Lb] = toOklch(brand);
  let strong = tone(Math.max(0.05, Math.min(0.98, Lb + (dark ? 0.06 : -0.07))), dark ? Math.min(C0, 0.14) : C0, h);
  if (contrast(strong, onBrand) < g.min) strong = brand;
  const soft = dark ? tone(0.28, Math.min(C0 * 0.45, 0.05), h) : tone(0.95, Math.min(C0 * 0.35, 0.035), h);
  let inkL = dark ? Math.max(0.8, Lb) : Math.min(L0, 0.5);
  const inkOk = (x) => { const c = tone(x, C0, h); return contrast(c, g.s0) >= g.min && contrast(c, soft) >= g.min && contrast(c, g.s1) >= g.min && contrast(c, g.alt) >= g.min; };
  inkL = walk(inkL, dark ? 1 : -1, inkOk);
  const brandInk = tone(inkL, C0, h);
  if (brandInk !== brand) notes.push({ token: 'brand-ink', from: seed.toUpperCase(), to: brandInk, reason: `ajustada para texto na cor da marca passar ${g.min}:1 sobre o fundo` });
  // navegação: a versão profunda da cor da escola; texto branco e secundário garantidos
  const hc = mode.startsWith('alto');
  const navC = Math.min(C0, hc ? 0.06 : 0.11);
  const nav = tone(mode === 'alto-contraste-escuro' ? 0.04 : dark ? 0.13 : hc ? 0.16 : 0.2, navC, h);
  const nav2 = tone(dark ? 0.27 : hc ? 0.28 : 0.31, Math.min(C0, 0.13), h);
  let L2 = 0.86; while (L2 < 0.99 && (contrast(tone(L2, 0.04, h), nav2) < g.min || contrast(tone(L2, 0.04, h), nav) < g.min)) L2 += 0.01;
  const onNav2 = tone(L2, 0.04, h);
  return {
    vars: { '--brand': brand, '--brand-strong': strong, '--brand-soft': soft, '--on-brand': onBrand, '--brand-ink': brandInk, '--nav': nav, '--nav-2': nav2, '--on-nav': '#FFFFFF', '--on-nav-2': onNav2 },
    checks: [
      { pair: 'on-brand / brand', ratio: contrast(onBrand, brand) },
      { pair: 'brand-ink / surface-0', ratio: contrast(brandInk, g.s0) },
      { pair: 'brand-ink / brand-soft', ratio: contrast(brandInk, soft) },
      { pair: 'on-nav-2 / nav-2', ratio: contrast(onNav2, nav2) },
    ],
    notes,
  };
}
const currentMode = () => (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'claro';
export const useThemeMode = () => {
  const [mode, setMode] = useState(currentMode);
  useEffect(() => {
    const mo = new MutationObserver(() => setMode(currentMode()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return mode;
};
/** Aplica a cor da escola aos filhos (variáveis CSS no wrapper). */
export function SchoolTheme({ seed, brand, mode, children, as: Tag = 'div', className, style }) {
  const live = useThemeMode();
  const m = mode || live;
  const pal = useMemo(() => (seed ? schoolPalette(seed, m) : null), [seed, m]);
  const bv = useMemo(() => (brand ? brandVars(brand, m).vars : null), [brand, m]);
  return <Tag className={cx('rc-school-theme', className)} style={{ ...(pal ? pal.vars : {}), ...(bv || {}), ...style }} data-theme-mode={m}>{children}</Tag>;
}

/* ---------- marca da escola (white label) ---------- */
export const DEFAULT_BRAND = { name: '', short: '', slogan: '', primary: '', secondary: '', accent: '', navStyle: 'secundaria', font: 'padrao', radius: 'suaves', logo: '', logoDark: '', symbol: '' };
const BRAND_KEY = 'recreio.marca';
const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v) => HEX.test(String(v || ''));
/** Lê a marca salva pela escola. Devolve null se não houver ou se o navegador bloquear o armazenamento. */
export const loadBrand = () => { try { const raw = window.localStorage.getItem(BRAND_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
/** Salva a marca e avisa todas as telas abertas. Passe null para voltar ao padrão. */
export const saveBrand = (b) => {
  try { if (b) window.localStorage.setItem(BRAND_KEY, JSON.stringify(b)); else window.localStorage.removeItem(BRAND_KEY); } catch (e) { /* sem armazenamento: vale só nesta tela */ }
  try { window.dispatchEvent(new CustomEvent('recreio:marca', { detail: b })); } catch (e) { /* navegador antigo */ }
};
const BRAND_FONTS = { arredondada: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", system-ui, sans-serif', serifada: 'Georgia, "Iowan Old Style", "Times New Roman", serif' };
const BRAND_RADIUS = { retos: ['2px', '3px', '4px', '6px', '8px'], arredondados: ['10px', '12px', '16px', '22px', '28px'] };
/** Variáveis CSS da marca: paleta com contraste garantido, menu, destaque, fonte e cantos. */
export function brandVars(brand = {}, mode = 'claro') {
  const out = {}; const notes = []; let checks = [];
  if (isHex(brand.primary)) { const pal = schoolPalette(brand.primary, mode); Object.assign(out, pal.vars); checks = pal.checks; notes.push(...pal.notes); }
  if (isHex(brand.secondary) && brand.navStyle !== 'primaria') { const p2 = schoolPalette(brand.secondary, mode).vars; out['--nav'] = p2['--nav']; out['--nav-2'] = p2['--nav-2']; out['--on-nav-2'] = p2['--on-nav-2']; out['--on-nav'] = '#FFFFFF'; }
  if (isHex(brand.accent)) { const [, C, h] = toOklch(brand.accent); out['--accent'] = brand.accent.toUpperCase(); out['--accent-soft'] = mode.includes('escuro') ? tone(0.26, Math.min(C * 0.4, 0.05), h) : tone(0.95, Math.min(C * 0.45, 0.06), h); }
  if (BRAND_FONTS[brand.font]) { if (brand.font === 'serifada') out['--font-display'] = BRAND_FONTS.serifada; else { out['--font-sans'] = BRAND_FONTS[brand.font]; out['--font-display'] = BRAND_FONTS[brand.font]; } }
  if (BRAND_RADIUS[brand.radius]) ['xs', 'sm', 'md', 'lg', 'xl'].forEach((k, i) => { out[`--radius-${k}`] = BRAND_RADIUS[brand.radius][i]; });
  return { vars: out, checks, notes };
}
const BrandCtx = createContext(null);
/** Marca salva pela escola, ou null quando vale o padrão da tela. */
export const useBrand = () => useContext(BrandCtx);

/* ---------- preferências de acessibilidade ---------- */
export const DEFAULT_PREFS = { textScale: 100, spacing: 'normal', font: 'padrao', motion: 'sistema', focus: false, reading: 'normal', theme: undefined };
const PrefsCtx = createContext({ prefs: DEFAULT_PREFS, setPrefs: () => {} });
export const usePreferences = () => useContext(PrefsCtx);
const applyPrefs = (p) => {
  const h = document.documentElement;
  h.style.fontSize = p.textScale && p.textScale !== 100 ? `${p.textScale}%` : '';
  const set = (k, v, def) => (v && v !== def ? h.setAttribute(k, v) : h.removeAttribute(k));
  set('data-spacing', p.spacing, 'normal');
  set('data-font', p.font, 'padrao');
  set('data-motion', p.motion, 'sistema');
  set('data-foco', p.focus ? 'on' : '', '');
  set('data-leitura', p.reading, 'normal');
  if (p.theme) h.setAttribute('data-theme', p.theme);
};

/* ---------- toasts ---------- */
const ToastCtx = createContext(null);
export const useToast = () => {
  const c = useContext(ToastCtx);
  return c || { show: (t) => console.warn('ToastProvider ausente', t), dismiss: () => {} };
};
const TONE_ICON = { success: 'check-circle', warning: 'alert', danger: 'x-circle', info: 'info', neutral: 'info', brand: 'info' };
export function ToastProvider({ children, max = 4 }) {
  const [items, setItems] = useState([]);
  const timers = useRef({});
  const dismiss = useCallback((id) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 220);
    clearTimeout(timers.current[id]);
  }, []);
  const arm = useCallback((id, ms) => { clearTimeout(timers.current[id]); if (ms) timers.current[id] = setTimeout(() => dismiss(id), ms); }, [dismiss]);
  const show = useCallback((t) => {
    const id = t.id || `t${Date.now()}${Math.random().toString(16).slice(2, 6)}`;
    const item = { tone: 'neutral', duration: t.action ? 7000 : 4500, ...t, id };
    setItems((xs) => [...xs.filter((x) => x.id !== id), item].slice(-max));
    arm(id, item.duration);
    return id;
  }, [arm, max]);
  return (
    <ToastCtx.Provider value={{ show, dismiss }}>
      {children}
      <div className="rc-toasts" role="region" aria-label="Notificações rápidas">
        {items.map((t) => (
          <div key={t.id} className={cx('rc-toast', `rc-tone-${t.tone}`, t.leaving && 'is-leaving')} role={t.tone === 'danger' ? 'alert' : 'status'}
            onMouseEnter={() => arm(t.id, 0)} onMouseLeave={() => arm(t.id, 2500)}>
            <Icon name={t.icon || TONE_ICON[t.tone] || 'info'} className="rc-toast-icon" />
            <div className="rc-toast-body">
              {t.title && <p className="rc-toast-title">{t.title}</p>}
              {t.message && <p className="rc-toast-msg">{t.message}</p>}
            </div>
            {t.action && <button type="button" className="rc-toast-action" onClick={() => { t.action.onClick && t.action.onClick(); dismiss(t.id); }}>{t.action.label}</button>}
            <button type="button" className="rc-toast-close" aria-label="Fechar" onClick={() => dismiss(t.id)}><Icon name="x" size={16} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Raiz do produto: preferências de acessibilidade, cor da escola e toasts. */
const RC_APP_RET = 'recreio:voltar-ao-app';
/** Quem sai do app nativo para o portal web leva um atalho de volta, como o "◀ App" do iOS. Guarda só o nome da tela de origem. */
function useAppReturn() {
  const [ret, setRet] = useState(null);
  useEffect(() => {
    const here = () => { const m = /(App-[A-Za-z-]+\.dc\.html)/.exec(window.location.pathname || ''); return m ? m[1] : null; };
    const isApp = !!document.querySelector('.rc-nat-body, .rc-nat-cam, .rc-nat-lock');
    try {
      if (isApp) window.sessionStorage.removeItem(RC_APP_RET);
      else { const v = window.sessionStorage.getItem(RC_APP_RET); if (v && /^App-[A-Za-z-]+\.dc\.html$/.test(v)) setRet(v); }
    } catch (e) { /* sem armazenamento, sem atalho */ }
    if (!isApp) return undefined;
    const onClick = (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
      const h = a.getAttribute('href') || '';
      if (!/\.dc\.html/.test(h) || /^App-/.test(h)) return;
      const tab = document.querySelector('.rc-tabbar-item:last-child'); const mais = tab ? (tab.getAttribute('href') || '') : '';
      try { window.sessionStorage.setItem(RC_APP_RET, here() || (/^App-/.test(mais) ? mais : 'App-Perfil-Escolha.dc.html')); } catch (err) { /* idem */ }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return ret;
}
export function RecreioProvider({ children, seed, theme, initialPrefs, onPrefsChange }) {
  const [prefs, setPrefsState] = useState({ ...DEFAULT_PREFS, ...(initialPrefs || {}), ...(theme ? { theme } : {}) });
  const setPrefs = useCallback((patch) => setPrefsState((p) => { const n = { ...p, ...(typeof patch === 'function' ? patch(p) : patch) }; onPrefsChange && onPrefsChange(n); return n; }), [onPrefsChange]);
  useLayoutEffect(() => { applyPrefs(prefs); }, [prefs]);
  useEffect(() => { if (theme) setPrefsState((p) => ({ ...p, theme })); }, [theme]);
  const appReturn = useAppReturn();
  const [brand, setBrand] = useState(loadBrand);
  useEffect(() => {
    const onBrand = (e) => setBrand(e && e.detail !== undefined ? e.detail : loadBrand());
    const onStorage = (e) => { if (!e.key || e.key === BRAND_KEY) setBrand(loadBrand()); };
    window.addEventListener('recreio:marca', onBrand); window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('recreio:marca', onBrand); window.removeEventListener('storage', onStorage); };
  }, []);
  return (
    <PrefsCtx.Provider value={{ prefs, setPrefs }}>
      <BrandCtx.Provider value={brand}>
        <ToastProvider>
          <SchoolTheme seed={seed} brand={brand} className="rc-root">{children}{appReturn && <a className="rc-nat-return" href={appReturn}><Icon name="chevron-left" size={14} />Voltar ao app</a>}</SchoolTheme>
        </ToastProvider>
      </BrandCtx.Provider>
    </PrefsCtx.Provider>
  );
}

/* ---------- portal simples ---------- */
export function Portal({ children }) {
  const [el] = useState(() => { const d = document.createElement('div'); d.className = 'rc-portal'; return d; });
  useLayoutEffect(() => { const host = document.querySelector('.rc-root') || document.body; host.appendChild(el); return () => { el.remove(); }; }, [el]);
  return window.ReactDOM.createPortal(children, el);
}
export const useFocusTrap = (ref, active) => {
  useEffect(() => {
    if (!active || !ref.current) return;
    const node = ref.current; const prev = document.activeElement;
    const q = () => [...node.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')];
    const first = q()[0]; (first || node).focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key !== 'Tab') return; const f = q(); if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    node.addEventListener('keydown', onKey);
    return () => { node.removeEventListener('keydown', onKey); prev && prev.focus && prev.focus({ preventScroll: true }); };
  }, [ref, active]);
};
