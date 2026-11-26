import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { cx, Icon } from './core.jsx';

export function Spinner({ size = 18, label = 'Carregando', className }) {
  return (
    <span className={cx('rc-spinner', className)} role="status" aria-label={label} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <circle cx="12" cy="12" r="9" className="rc-spinner-track" />
        <circle cx="12" cy="12" r="9" className="rc-spinner-arc" />
      </svg>
    </span>
  );
}

/** Botão. Primário no máximo um por área; verbo primeiro, frase curta. */
export const Button = React.forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon, iconRight, loading = false, loadingLabel, full = false, className, children, disabled, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={cx('rc-btn', `rc-btn-${variant}`, `rc-btn-${size}`, full && 'rc-btn-full', loading && 'is-loading', className)}
      disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner size={size === 'sm' ? 14 : 16} label={loadingLabel || 'Processando'} /> : icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children != null && <span className="rc-btn-label">{loading && loadingLabel ? loadingLabel : children}</span>}
      {!loading && iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </button>
  );
});

/** Botão só de ícone. O rótulo é obrigatório e vira o nome acessível e a dica. */
export const IconButton = React.forwardRef(function IconButton({ icon, label, variant = 'ghost', size = 'md', badge, className, ...rest }, ref) {
  return (
    <button ref={ref} type="button" className={cx('rc-iconbtn', `rc-iconbtn-${variant}`, `rc-iconbtn-${size}`, className)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 18 : 20} />
      {badge ? <span className="rc-iconbtn-badge" aria-hidden="true">{badge === true ? '' : badge}</span> : null}
    </button>
  );
});

/** Copia um texto e confirma com um check animado. Usado no Pix copia e cola e em códigos. */
export function CopyButton({ text, label = 'Copiar', copiedLabel = 'Copiado', variant = 'secondary', size = 'md', full, onCopied }) {
  const [done, setDone] = useState(false);
  const t = useRef();
  useEffect(() => () => clearTimeout(t.current), []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch (e) { /* ambiente sem clipboard */ }
    setDone(true); onCopied && onCopied(); clearTimeout(t.current); t.current = setTimeout(() => setDone(false), 2200);
  };
  return (
    <button type="button" className={cx('rc-btn', `rc-btn-${variant}`, `rc-btn-${size}`, full && 'rc-btn-full', 'rc-copybtn', done && 'is-done')} onClick={copy} aria-live="polite">
      <span className="rc-copybtn-icons" aria-hidden="true">
        <Icon name="copy" size={18} className="rc-copybtn-copy" />
        <svg className="rc-copybtn-check" viewBox="0 0 24 24" width="18" height="18"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </span>
      <span className="rc-btn-label">{done ? copiedLabel : label}</span>
    </button>
  );
}

/** Alternância entre 2 a 5 opções exclusivas, com marcador que desliza. */
export function SegmentedControl({ options, value, onChange, size = 'md', label, full }) {
  const wrap = useRef(null);
  const [thumb, setThumb] = useState(null);
  const idx = Math.max(0, options.findIndex((o) => (o.value ?? o) === value));
  useLayoutEffect(() => {
    const el = wrap.current && wrap.current.querySelectorAll('.rc-seg-opt')[idx];
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [idx, options.length]);
  const onKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = (idx + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    const o = options[n]; onChange && onChange(o.value ?? o);
    const btn = wrap.current.querySelectorAll('.rc-seg-opt')[n]; btn && btn.focus();
  };
  return (
    <div ref={wrap} className={cx('rc-seg', `rc-seg-${size}`, full && 'rc-seg-full')} role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {thumb && <span className="rc-seg-thumb" style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }} aria-hidden="true" />}
      {options.map((o, i) => {
        const v = o.value ?? o; const on = i === idx;
        return (
          <button key={String(v)} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} className={cx('rc-seg-opt', on && 'is-on')} onClick={() => onChange && onChange(v)}>
            {o.icon && <Icon name={o.icon} size={16} />}<span>{o.label ?? o}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Kbd({ children }) { return <kbd className="rc-kbd">{children}</kbd>; }
