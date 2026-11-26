import type {
  FieldProps,
  TextFieldProps,
  CheckboxProps,
  CodeInputProps,
  FileDropProps,
  FilterChipsProps,
  RadioGroupProps,
  SearchFieldProps,
  SelectProps,
  SliderProps,
  SwitchProps,
  TextAreaProps,
} from './types';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { cx, Icon, useUid } from './core';
import { Kbd } from './actions';

/* Moldura comum: rótulo, obrigatório por extenso, ajuda, erro e sucesso com ícone. */
export function Field({
  id,
  label,
  hint,
  error,
  success,
  required,
  optional,
  children,
  className,
  counter,
}: FieldProps) {
  return (
    <div className={cx('rc-field', error && 'has-error', success && 'has-success', className)}>
      {label && (
        <label className="rc-field-label" htmlFor={id}>
          {label}
          {required && <span className="rc-field-req"> (obrigatório)</span>}
          {optional && <span className="rc-field-opt"> (opcional)</span>}
        </label>
      )}
      {children}
      <div className="rc-field-foot">
        {error ? (
          <p className="rc-field-msg is-error" id={`${id}-msg`}>
            <Icon name="x-circle" size={16} />
            {error}
          </p>
        ) : success ? (
          <p className="rc-field-msg is-success" id={`${id}-msg`}>
            <Icon name="check-circle" size={16} />
            {success}
          </p>
        ) : hint ? (
          <p className="rc-field-msg" id={`${id}-msg`}>
            {hint}
          </p>
        ) : (
          <span />
        )}
        {counter}
      </div>
    </div>
  );
}

export const TextField = React.forwardRef(function TextField(
  {
    label,
    hint,
    error,
    success,
    required,
    optional,
    icon,
    suffix,
    size = 'md',
    className,
    id,
    maxLength,
    value,
    defaultValue,
    onChange,
    type = 'text',
    ...rest
  }: TextFieldProps,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const uid = useUid('tf');
  const fid = id || uid;
  const [len, setLen] = useState(String(value ?? defaultValue ?? '').length);
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <Field
      id={fid}
      label={label}
      hint={hint}
      error={error}
      success={success}
      required={required}
      optional={optional}
      className={className}
      counter={
        maxLength ? (
          <span className="rc-field-count" aria-live="polite">
            {len}/{maxLength}
          </span>
        ) : null
      }
    >
      <div className={cx('rc-input', `rc-input-${size}`)}>
        {icon && <Icon name={icon} size={18} className="rc-input-icon" />}
        <input
          ref={ref}
          id={fid}
          type={isPw && show ? 'text' : type}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint || success ? `${fid}-msg` : undefined}
          required={required}
          onChange={(e) => {
            setLen(e.target.value.length);
            onChange && onChange(e);
          }}
          {...rest}
        />
        {isPw && (
          <button
            type="button"
            className="rc-input-affix-btn"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
          >
            <Icon name="eye" size={18} />
          </button>
        )}
        {suffix && <span className="rc-input-suffix">{suffix}</span>}
      </div>
    </Field>
  );
});

export function TextArea({
  label,
  hint,
  error,
  required,
  optional,
  rows = 4,
  autoGrow = true,
  maxLength,
  className,
  id,
  onChange,
  value,
  defaultValue,
  ...rest
}: TextAreaProps) {
  const uid = useUid('ta');
  const fid = id || uid;
  const r = useRef<HTMLTextAreaElement>(null);
  const [len, setLen] = useState(String(value ?? defaultValue ?? '').length);
  const grow = () => {
    if (autoGrow && r.current) {
      r.current.style.height = 'auto';
      r.current.style.height = `${r.current.scrollHeight + 2}px`;
    }
  };
  useLayoutEffect(grow, []);
  return (
    <Field
      id={fid}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={className}
      counter={
        maxLength ? (
          <span className="rc-field-count">
            {len}/{maxLength}
          </span>
        ) : null
      }
    >
      <textarea
        ref={r}
        id={fid}
        className="rc-textarea"
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? `${fid}-msg` : undefined}
        onChange={(e) => {
          setLen(e.target.value.length);
          grow();
          onChange && onChange(e);
        }}
        {...rest}
      />
    </Field>
  );
}

/** Busca com atalho de teclado visível e botão de limpar. */
export function SearchField({
  placeholder = 'Buscar aluno, turma ou responsável',
  shortcut = 'Ctrl K',
  value,
  onChange,
  onClear,
  size = 'md',
  label = 'Buscar',
  className,
  ...rest
}: SearchFieldProps) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => {
    if (value !== undefined) setV(value);
  }, [value]);
  return (
    <div className={cx('rc-input', 'rc-search', `rc-input-${size}`, className)} role="search">
      <Icon name="search" size={18} className="rc-input-icon" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          onChange && onChange(e);
        }}
        {...rest}
      />
      {v ? (
        <button
          type="button"
          className="rc-input-affix-btn"
          aria-label="Limpar busca"
          onClick={() => {
            setV('');
            onClear && onClear();
          }}
        >
          <Icon name="x" size={16} />
        </button>
      ) : shortcut ? (
        <Kbd>{shortcut}</Kbd>
      ) : null}
    </div>
  );
}

/** Lista suspensa própria: botão com o valor e um painel de opções com margem, destaque e check. Teclado: setas, Home, End, Enter, Esc. */
export function Select({
  label,
  hint,
  error,
  required,
  options = [],
  placeholder,
  className,
  id,
  size = 'md',
  value,
  defaultValue,
  onChange,
  disabled,
  name,
}: SelectProps) {
  const uid = useUid('sel');
  const fid = id || uid;
  const opts = options.map((o) => ({ value: String(o.value ?? o), label: o.label ?? String(o), hint: o.hint }));
  const controlled = value !== undefined && value !== null;
  const [inner, setInner] = useState(
    defaultValue != null ? String(defaultValue) : placeholder ? '' : opts[0] ? opts[0].value : '',
  );
  const cur = controlled ? String(value) : inner;
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const selIdx = opts.findIndex((o) => o.value === cur);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);
  useEffect(() => {
    if (open) setHi(selIdx >= 0 ? selIdx : 0);
  }, [open]);
  useEffect(() => {
    if (open && list.current && hi >= 0) {
      const el = list.current.children[hi];
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }
  }, [hi, open]);
  const pick = (v: string) => {
    if (!controlled) setInner(v);
    if (onChange) onChange({ target: { value: v, name } });
    setOpen(false);
    if (btn.current) btn.current.focus();
  };
  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((h) => Math.min(opts.length - 1, h + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setHi(0);
    }
    if (e.key === 'End') {
      e.preventDefault();
      setHi(opts.length - 1);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (opts[hi]) pick(opts[hi].value);
    }
  };
  const curOpt = opts[selIdx];
  return (
    <Field id={fid} label={label} hint={hint} error={error} required={required} className={className}>
      <div
        ref={ref}
        className={cx('rc-input', 'rc-select', `rc-input-${size}`, open && 'is-open', disabled && 'is-disabled')}
      >
        <button
          ref={btn}
          type="button"
          id={fid}
          className="rc-select-btn"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${fid}-list`}
          aria-activedescendant={open && hi >= 0 ? `${fid}-o${hi}` : undefined}
          aria-invalid={!!error || undefined}
          aria-required={required || undefined}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={onKey}
        >
          <span className={cx('rc-select-value', !curOpt && 'is-placeholder')}>
            {curOpt ? curOpt.label : placeholder || 'Selecione'}
          </span>
        </button>
        <Icon name="chevron-down" size={18} className="rc-select-caret" />
        {name && <input type="hidden" name={name} value={cur} />}
        {open && (
          <ul id={`${fid}-list`} role="listbox" ref={list} className="rc-select-list" aria-labelledby={fid}>
            {opts.map((o, i) => (
              <li
                key={o.value}
                id={`${fid}-o${i}`}
                role="option"
                aria-selected={o.value === cur}
                className={cx('rc-select-opt', i === hi && 'is-hi', o.value === cur && 'is-sel')}
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o.value)}
              >
                <span className="rc-select-opt-text">
                  {o.label}
                  {o.hint && <small>{o.hint}</small>}
                </span>
                {o.value === cur && <Icon name="check" size={18} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

/** Caixa de seleção com check que se desenha. Aceita estado indeterminado. */
export function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  indeterminate,
  onChange,
  disabled,
  id,
  className,
}: CheckboxProps) {
  const uid = useUid('cb');
  const fid = id || uid;
  const r = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (r.current) r.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <label className={cx('rc-check', disabled && 'is-disabled', className)} htmlFor={fid}>
      <span className="rc-check-box">
        <input
          ref={r}
          id={fid}
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          disabled={disabled}
        />
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path className="rc-check-mark" d="M3.5 8.5l3 3 6-6.5" />
          <path className="rc-check-dash" d="M4 8h8" />
        </svg>
      </span>
      {(label || description) && (
        <span className="rc-check-text">
          {label && <span className="rc-check-label">{label}</span>}
          {description && <span className="rc-check-desc">{description}</span>}
        </span>
      )}
    </label>
  );
}

/** Grupo de opções exclusivas. variant="cards" para escolhas com descrição (ex.: forma de pagamento). */
export function RadioGroup({ legend, name, options, value, onChange, variant = 'list', columns = 1 }: RadioGroupProps) {
  const uid = useUid('rg');
  const n = name || uid;
  return (
    <fieldset className={cx('rc-radios', `rc-radios-${variant}`)} style={{ '--cols': columns }}>
      {legend && <legend className="rc-field-label">{legend}</legend>}
      <div className="rc-radios-items">
        {options.map((o) => {
          const v = o.value ?? o;
          const on = v === value;
          return (
            <label key={String(v)} className={cx('rc-radio', on && 'is-on', o.disabled && 'is-disabled')}>
              <input
                type="radio"
                name={n}
                value={v}
                checked={on}
                disabled={o.disabled}
                onChange={() => onChange && onChange(v)}
              />
              <span className="rc-radio-dot" aria-hidden="true" />
              {o.icon && variant === 'cards' && <Icon name={o.icon} size={20} className="rc-radio-icon" />}
              <span className="rc-radio-text">
                <span className="rc-radio-label">{o.label ?? o}</span>
                {o.description && <span className="rc-radio-desc">{o.description}</span>}
              </span>
              {o.meta && <span className="rc-radio-meta">{o.meta}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Switch({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  disabled,
  id,
  className,
  size = 'md',
}: SwitchProps) {
  const uid = useUid('sw');
  const fid = id || uid;
  const [on, setOn] = useState(!!(checked ?? defaultChecked));
  useEffect(() => {
    if (checked !== undefined) setOn(!!checked);
  }, [checked]);
  return (
    <label className={cx('rc-switch', `rc-switch-${size}`, disabled && 'is-disabled', className)} htmlFor={fid}>
      {(label || description) && (
        <span className="rc-switch-text">
          {label && <span className="rc-switch-label">{label}</span>}
          {description && <span className="rc-switch-desc">{description}</span>}
        </span>
      )}
      <span className="rc-switch-ctl">
        <input
          id={fid}
          type="checkbox"
          role="switch"
          checked={on}
          disabled={disabled}
          aria-checked={on}
          onChange={(e) => {
            if (checked === undefined) setOn(e.target.checked);
            onChange && onChange(e.target.checked, e);
          }}
        />
        <span className="rc-switch-track" aria-hidden="true">
          <span className="rc-switch-knob">
            <svg viewBox="0 0 12 12">
              <path d="M2.5 6.25l2.25 2.25L9.5 3.75" />
            </svg>
          </span>
        </span>
      </span>
    </label>
  );
}

/** Código de verificação (entrada sem senha). Avança sozinho e aceita colar o código inteiro. */
export function CodeInput({ length = 6, onComplete, error, label = 'Código de verificação', hint }: CodeInputProps) {
  const [vals, setVals] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const setAt = (i: number, ch: string) => {
    const n = [...vals];
    n[i] = ch;
    setVals(n);
    if (ch && i < length - 1) refs.current[i + 1]!.focus();
    if (n.every(Boolean)) onComplete && onComplete(n.join(''));
  };
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!d) return;
    e.preventDefault();
    const n = Array(length)
      .fill('')
      .map((_, i) => d[i] || '');
    setVals(n);
    refs.current[Math.min(d.length, length - 1)]!.focus();
    if (n.every(Boolean)) onComplete && onComplete(n.join(''));
  };
  return (
    <fieldset className={cx('rc-code', error && 'has-error')}>
      <legend className="rc-field-label">{label}</legend>
      <div className="rc-code-boxes" onPaste={onPaste}>
        {vals.map((v, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cx('rc-code-box', v && 'is-filled')}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={v}
            aria-label={`Dígito ${i + 1} de ${length}`}
            onChange={(e) => setAt(i, e.target.value.replace(/\D/g, '').slice(-1))}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !vals[i] && i > 0) refs.current[i - 1]!.focus();
              if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]!.focus();
              if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]!.focus();
            }}
          />
        ))}
      </div>
      {error ? (
        <p className="rc-field-msg is-error">
          <Icon name="x-circle" size={16} />
          {error}
        </p>
      ) : hint ? (
        <p className="rc-field-msg">{hint}</p>
      ) : null}
    </fieldset>
  );
}

/** Controle deslizante com valor visível. Usado no tamanho do texto. */
export function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  format = (v) => v,
  marks,
  id,
}: SliderProps) {
  const uid = useUid('sl');
  const fid = id || uid;
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="rc-slider">
      <div className="rc-slider-head">
        <label htmlFor={fid} className="rc-field-label">
          {label}
        </label>
        <output htmlFor={fid} className="rc-slider-out">
          {format(value)}
        </output>
      </div>
      <input
        id={fid}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--pct': `${pct}%` }}
        onChange={(e) => onChange && onChange(Number(e.target.value))}
        aria-valuetext={String(format(value))}
      />
      {marks && (
        <div className="rc-slider-marks" aria-hidden="true">
          {marks.map((m) => (
            <span key={m}>{format(m)}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Chips de filtro: seleção múltipla com contagem. */
export function FilterChips({ options, value = [], onChange, label, single }: FilterChipsProps) {
  const toggle = (v: string) => {
    if (single) return onChange && onChange(value[0] === v ? [] : [v]);
    onChange && onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="rc-chips" role="group" aria-label={label}>
      {options.map((o) => {
        const v = o.value ?? o;
        const on = value.includes(v);
        return (
          <button
            key={String(v)}
            type="button"
            className={cx('rc-chip', on && 'is-on')}
            aria-pressed={on}
            onClick={() => toggle(v)}
          >
            <span className="rc-chip-check" aria-hidden="true">
              <Icon name="check" size={14} strokeWidth={2.25} />
            </span>
            <span>{o.label ?? o}</span>
            {o.count != null && <span className="rc-chip-count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Área de envio com arrastar e soltar e lista com progresso por arquivo. */
export function FileDrop({
  label = 'Arraste arquivos ou escolha no aparelho',
  hint = 'PDF, JPG ou PNG até 10 MB',
  accept,
  files = [],
  onFiles,
  onRemove,
  multiple = true,
}: FileDropProps) {
  const [over, setOver] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  const take = (list: FileList) => onFiles && onFiles([...list]);
  return (
    <div className="rc-filedrop-wrap">
      <div
        className={cx('rc-filedrop', over && 'is-over')}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
      >
        <Icon name="upload" size={22} />
        <p className="rc-filedrop-label">{label}</p>
        <p className="rc-filedrop-hint">{hint}</p>
        <button type="button" className="rc-btn rc-btn-secondary rc-btn-sm" onClick={() => inp.current!.click()}>
          Escolher arquivo
        </button>
        <input
          ref={inp}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onChange={(e) => take(e.target.files!)}
        />
      </div>
      {files.length > 0 && (
        <ul className="rc-filelist">
          {files.map((f) => (
            <li key={f.name} className={cx('rc-file', f.error && 'has-error')}>
              <Icon name={/\.(png|jpe?g|webp)$/i.test(f.name) ? 'image' : 'file-text'} size={20} />
              <div className="rc-file-body">
                <p className="rc-file-name">{f.name}</p>
                {f.error ? (
                  <p className="rc-file-meta is-error">{f.error}</p>
                ) : f.progress !== undefined && f.progress < 100 ? (
                  <div
                    className="rc-progress rc-progress-sm"
                    role="progressbar"
                    aria-valuenow={f.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Enviando ${f.name}`}
                  >
                    <span style={{ width: `${f.progress}%` }} />
                  </div>
                ) : (
                  <p className="rc-file-meta">{f.size || 'Enviado'}</p>
                )}
              </div>
              {f.progress !== undefined && f.progress >= 100 && !f.error && (
                <Icon name="check-circle" size={18} className="rc-file-ok" />
              )}
              <button
                type="button"
                className="rc-iconbtn rc-iconbtn-ghost rc-iconbtn-sm"
                aria-label={`Remover ${f.name}`}
                onClick={() => onRemove && onRemove(f)}
              >
                <Icon name="x" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
