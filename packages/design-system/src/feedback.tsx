import type {
  Tone,
  UseUnsavedOptions,
  AlertProps,
  BadgeProps,
  ConfirmDialogProps,
  DialogProps,
  EmptyStateProps,
  ErrorStateProps,
  LoadingCardProps,
  MenuProps,
  ProgressBarProps,
  ProgressRingProps,
  SaveGuardProps,
  SheetProps,
  SkeletonProps,
  StatusPillProps,
  TooltipProps,
} from './types';
import React, { useState, useRef, useEffect } from 'react';
import { cx, Icon, Portal, useFocusTrap, useOnClickOutside, useUid, useToast } from './core';
import { Button, IconButton } from './actions';

/** Contador numérico ou ponto. Para status com palavra, use StatusPill. */
export function Badge({ children, tone = 'brand', dot, pulse, label, className }: BadgeProps) {
  if (dot)
    return (
      <span
        className={cx('rc-dot', `rc-dot-${tone}`, pulse && 'is-pulse', className)}
        role={label ? 'img' : undefined}
        aria-label={label}
      />
    );
  return (
    <span className={cx('rc-badge', `rc-badge-${tone}`, className)} aria-label={label}>
      {children}
    </span>
  );
}

const STATUS_ICON: Record<Tone, string> = {
  success: 'check-circle',
  warning: 'clock',
  danger: 'alert',
  info: 'info',
  neutral: 'info',
  brand: 'star',
};
/** Status com ícone e palavra. Cor nunca sozinha. */
export function StatusPill({ tone = 'neutral', icon, children, size = 'md', className }: StatusPillProps) {
  return (
    <span className={cx('rc-pill', `rc-pill-${tone}`, `rc-pill-${size}`, className)}>
      <Icon name={icon || STATUS_ICON[tone]} size={size === 'sm' ? 14 : 16} />
      <span>{children}</span>
    </span>
  );
}

/** Aviso dentro da página: o que aconteceu e o que fazer. */
export function Alert({ tone = 'info', title, children, actions, onClose, icon, className }: AlertProps) {
  return (
    <div className={cx('rc-alert', `rc-alert-${tone}`, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon name={icon || STATUS_ICON[tone] || 'info'} size={20} className="rc-alert-icon" />
      <div className="rc-alert-body">
        {title && <p className="rc-alert-title">{title}</p>}
        {children && <div className="rc-alert-text">{children}</div>}
        {actions && <div className="rc-alert-actions">{actions}</div>}
      </div>
      {onClose && <IconButton icon="x" label="Fechar aviso" size="sm" onClick={onClose} />}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  hideLabel,
  showValue,
  tone = 'brand',
  size = 'md',
  className,
}: ProgressBarProps) {
  const ind = value == null;
  const pct = ind ? 0 : Math.round((value / max) * 100);
  return (
    <div className={cx('rc-progress-wrap', className)}>
      {((label && !hideLabel) || showValue) && (
        <div className="rc-progress-head">
          {label && !hideLabel && <span>{label}</span>}
          {showValue && !ind && <span className="rc-progress-val">{pct}%</span>}
        </div>
      )}
      <div
        className={cx('rc-progress', `rc-progress-${size}`, `rc-progress-${tone}`, ind && 'is-indeterminate')}
        role="progressbar"
        aria-label={label || 'Progresso'}
        aria-valuemin={ind ? undefined : 0}
        aria-valuemax={ind ? undefined : max}
        aria-valuenow={ind ? undefined : value}
      >
        <span style={ind ? undefined : { width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ProgressRing({
  value = 0,
  max = 100,
  size = 64,
  stroke = 6,
  label,
  tone = 'brand',
  children,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const [p, setP] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setP(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return (
    <div
      className={cx('rc-ring', `rc-ring-${tone}`)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="rc-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="rc-ring-bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="rc-ring-center">{children ?? `${Math.round(pct * 100)}%`}</span>
    </div>
  );
}

/** Esqueleto de carregamento. Mostra a forma do conteúdo que vem; brilho desliga com movimento reduzido. */
export function Skeleton({ variant = 'text', lines = 1, width, height, className, radius }: SkeletonProps) {
  if (variant === 'text') {
    return (
      <span className={cx('rc-skel-lines', className)} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className="rc-skel rc-skel-text"
            style={{ width: i === lines - 1 && lines > 1 ? '62%' : width || '100%' }}
          />
        ))}
      </span>
    );
  }
  return (
    <span
      className={cx('rc-skel', `rc-skel-${variant}`, className)}
      aria-hidden="true"
      style={{ width, height, borderRadius: radius }}
    />
  );
}
/** Bloco pronto: cartão em carregamento com anúncio para leitor de tela. */
export function LoadingCard({ label = 'Carregando', rows = 3, avatar = true }: LoadingCardProps) {
  return (
    <div className="rc-card rc-loadingcard" role="status" aria-live="polite" aria-label={label}>
      <div className="rc-loadingcard-head">
        {avatar && <Skeleton variant="circle" width={40} height={40} />}
        <div style={{ flex: 1 }}>
          <Skeleton width="45%" />
          <Skeleton width="28%" className="rc-skel-sub" />
        </div>
      </div>
      <Skeleton lines={rows} />
    </div>
  );
}

/* Arte de estado vazio: três peças nas cores Recreio e um espaço tracejado esperando conteúdo. Sem ilustração genérica. */
const Tiles = ({ tone = 'brand' }: { tone?: string }) => (
  <svg className={cx('rc-tiles', `rc-tiles-${tone}`)} width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
    <rect x="4" y="4" width="30" height="30" rx="8" className="rc-tile-a" />
    <rect x="38" y="4" width="30" height="30" rx="8" className="rc-tile-b" />
    <rect x="4" y="38" width="30" height="30" rx="8" className="rc-tile-c" />
    <rect x="39" y="39" width="28" height="28" rx="7.5" className="rc-tile-empty" />
  </svg>
);
export function EmptyState({ title, children, action, secondary, tone = 'brand', compact }: EmptyStateProps) {
  return (
    <div className={cx('rc-empty', compact && 'is-compact')}>
      <Tiles tone={tone} />
      <h3 className="rc-empty-title">{title}</h3>
      {children && <p className="rc-empty-text">{children}</p>}
      {(action || secondary) && (
        <div className="rc-empty-actions">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}
export function ErrorState({ title, children, onRetry, offline, details }: ErrorStateProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rc-empty rc-error" role="alert">
      <span className="rc-error-icon">
        <Icon name={offline ? 'wifi-off' : 'alert'} size={28} />
      </span>
      <h3 className="rc-empty-title">{title || (offline ? 'Você está sem conexão' : 'Não deu para carregar agora')}</h3>
      <p className="rc-empty-text">
        {children ||
          (offline
            ? 'O que já foi carregado continua disponível. Assim que a internet voltar, a página atualiza sozinha.'
            : 'Os dados estão salvos. Tente de novo em alguns segundos.')}
      </p>
      <div className="rc-empty-actions">
        {onRetry && (
          <Button variant="primary" icon="refresh" onClick={onRetry}>
            Tentar de novo
          </Button>
        )}
        {details && (
          <Button variant="ghost" onClick={() => setOpen((o) => !o)}>
            {open ? 'Esconder detalhes' : 'Ver detalhes'}
          </Button>
        )}
      </div>
      {open && details && <pre className="rc-error-details">{details}</pre>}
    </div>
  );
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useUid('tip');
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = () => {
    clearTimeout(t.current);
    t.current = setTimeout(() => setOpen(true), 350);
  };
  const hide = () => {
    clearTimeout(t.current);
    setOpen(false);
  };
  return (
    <span
      className="rc-tip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={() => setOpen(true)}
      onBlur={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}
    >
      {React.isValidElement<{ 'aria-describedby'?: string }>(children)
        ? React.cloneElement(children, { 'aria-describedby': open ? id : undefined })
        : children}
      <span id={id} role="tooltip" className={cx('rc-tip', `rc-tip-${side}`, open && 'is-open')}>
        {content}
      </span>
    </span>
  );
}

/** Mantém o painel montado durante a animação de saída: `render` some `ms` depois de `open` virar false. */
function usePresence(open: boolean, ms: number) {
  const [render, setRender] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setRender(true);
      setLeaving(false);
    } else if (render) setLeaving(true);
  }
  useEffect(() => {
    if (!leaving) return undefined;
    const t = setTimeout(() => {
      setRender(false);
      setLeaving(false);
    }, ms);
    return () => clearTimeout(t);
  }, [leaving, ms]);
  return { render, leaving };
}

/** Diálogo modal. Prende o foco, fecha com Esc, devolve o foco ao sair. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissable = true,
  icon,
  tone,
}: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { render, leaving } = usePresence(open, 200);
  const tid = useUid('dlg');
  useFocusTrap(ref, open && render);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose && onClose();
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, dismissable, onClose]);
  if (!render) return null;
  return (
    <Portal>
      <div
        className={cx('rc-overlay', leaving && 'is-leaving')}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && dismissable) onClose && onClose();
        }}
      >
        <div
          ref={ref}
          className={cx('rc-dialog', `rc-dialog-${size}`, leaving && 'is-leaving')}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${tid}-t`}
          tabIndex={-1}
        >
          <header className="rc-dialog-head">
            {icon && (
              <span className={cx('rc-dialog-icon', tone && `rc-tone-${tone}`)}>
                <Icon name={icon} size={22} />
              </span>
            )}
            <div className="rc-dialog-titles">
              <h2 id={`${tid}-t`} className="rc-dialog-title">
                {title}
              </h2>
              {description && <p className="rc-dialog-desc">{description}</p>}
            </div>
            {dismissable && <IconButton icon="x" label="Fechar" onClick={onClose} />}
          </header>
          {children && <div className="rc-dialog-body">{children}</div>}
          {footer && <footer className="rc-dialog-foot">{footer}</footer>}
        </div>
      </div>
    </Portal>
  );
}
/** Confirmação de ação que não se desfaz: diz exatamente o que vai acontecer. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      icon={tone === 'danger' ? 'alert' : 'info'}
      tone={tone}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}

/** Aviso ao sair com alterações pendentes. Devolve o diálogo para o componente renderizar. Intercepta links para outra tela e o fechamento da aba. */
export function useUnsaved(
  dirty: boolean,
  { onSave, onLeave, title = 'Sair sem salvar?', children }: UseUnsavedOptions = {},
) {
  const [href, setHref] = useState<string | null>(null);
  const free = useRef(false);
  useEffect(() => {
    if (!dirty) return undefined;
    free.current = false;
    const click = (e: MouseEvent) => {
      if (free.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a =
        e.target && (e.target as Element).closest ? (e.target as Element).closest<HTMLAnchorElement>('a[href]') : null;
      if (!a || a.closest('[data-leave-ok]')) return;
      const h = a.getAttribute('href');
      if (!h || h.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
      e.preventDefault();
      e.stopPropagation();
      setHref(h);
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (free.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('click', click, true);
    window.addEventListener('beforeunload', unload);
    return () => {
      document.removeEventListener('click', click, true);
      window.removeEventListener('beforeunload', unload);
    };
  }, [dirty]);
  const go = (h: string | null) => {
    free.current = true;
    setHref(null);
    onLeave && onLeave(h);
    if (h) window.location.href = h;
  };
  const dialog = (
    <Dialog
      open={!!href}
      onClose={() => setHref(null)}
      title={title}
      size={onSave ? 'md' : 'sm'}
      icon="alert"
      tone="warning"
      footer={
        <>
          <Button variant="ghost" onClick={() => setHref(null)}>
            Continuar editando
          </Button>
          <Button variant="secondary" onClick={() => go(href)}>
            Sair sem salvar
          </Button>
          {onSave && (
            <Button
              variant="primary"
              icon="check"
              onClick={() => {
                const h = href;
                onSave();
                go(h);
              }}
            >
              Salvar e sair
            </Button>
          )}
        </>
      }
    >
      {children || 'As alterações desta tela ainda não foram salvas. Se você sair agora, elas serão perdidas.'}
    </Dialog>
  );
  return { dialog, asking: !!href, cancel: () => setHref(null) };
}

const SAVE_CLICK =
  'button[aria-pressed], [role="radio"], [role="checkbox"], [role="switch"]:not(input), [role="option"]:not([aria-selected="true"]), [data-save-change]';
const hora = () => {
  const d = new Date();
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Regra de salvar do sistema: envolve qualquer região editável. Salvar nasce desabilitado, habilita na primeira mudança e avisa ao sair sem salvar. */
export function SaveGuard({
  children,
  label = 'Salvar alterações',
  savingLabel = 'Salvando',
  savedTitle = 'Alterações salvas',
  savedMessage,
  onSave,
  onDiscard,
  sticky = false,
  hint,
  savedAt,
  defaultDirty = 0,
  className,
}: SaveGuardProps) {
  const box = useRef<HTMLDivElement>(null);
  const touched = useRef(new Set<Element>());
  const toast = useToast();
  const [dirty, setDirty] = useState(defaultDirty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(savedAt || '');
  const [rev, setRev] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const mark = (t: Element | null) => {
      if (!t || !t.closest || t.closest('[data-nosave], .rc-savebar')) return;
      if ((t as HTMLInputElement).type === 'search' || t.getAttribute('role') === 'searchbox') return;
      const c = t.closest('label, .rc-select, .rc-field, [role="radiogroup"], [role="group"]');
      touched.current.add(c && el.contains(c) && c !== el ? c : t);
      setDirty(touched.current.size);
    };
    const change = (e: Event) => mark(e.target as Element | null);
    const click = (e: MouseEvent) => {
      const t = e.target && (e.target as Element).closest ? (e.target as Element).closest(SAVE_CLICK) : null;
      if (t && el.contains(t)) mark(t);
    };
    el.addEventListener('input', change);
    el.addEventListener('change', change);
    el.addEventListener('click', click);
    return () => {
      el.removeEventListener('input', change);
      el.removeEventListener('change', change);
      el.removeEventListener('click', click);
    };
  }, []);
  const clear = () => {
    touched.current = new Set();
    setDirty(0);
  };
  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      clear();
      setSaved(hora());
      toast.show({ tone: 'success', title: savedTitle, message: savedMessage });
      onSave && onSave();
    }, 600);
  };
  const discard = () => {
    clear();
    setRev((r) => r + 1);
    onDiscard && onDiscard();
  };
  const leave = useUnsaved(dirty > 0, {
    onSave: () => {
      clear();
      setSaved(hora());
      onSave && onSave();
    },
  });
  return (
    <div ref={box} className={cx('rc-saveguard', sticky && 'is-sticky', className)}>
      <div className="rc-saveguard-body" key={rev}>
        {children}
      </div>
      <div className={cx('rc-savebar', dirty > 0 && 'is-dirty')} role="group" aria-label="Salvar">
        <p className="rc-savebar-status" aria-live="polite">
          <Icon name={dirty > 0 ? 'clock' : 'check'} size={16} />
          <span>
            {dirty > 0
              ? `${dirty} ${dirty === 1 ? 'alteração' : 'alterações'} sem salvar`
              : saved
                ? `Tudo salvo às ${saved}`
                : hint || 'Nenhuma alteração para salvar'}
          </span>
        </p>
        <Button variant="ghost" disabled={!dirty || saving} onClick={discard}>
          Descartar
        </Button>
        <Button
          variant="primary"
          icon="check"
          disabled={!dirty}
          loading={saving}
          loadingLabel={savingLabel}
          onClick={save}
        >
          {label}
        </Button>
      </div>
      {leave.dialog}
    </div>
  );
}

/** Gaveta: sobe de baixo no celular, desliza da direita no desktop. */
export function Sheet({ open, onClose, title, children, footer, side = 'auto', width = 440 }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { render, leaving } = usePresence(open, 260);
  const tid = useUid('sh');
  useFocusTrap(ref, open && render);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!render) return null;
  return (
    <Portal>
      <div
        className={cx('rc-overlay', 'rc-overlay-sheet', leaving && 'is-leaving')}
        onMouseDown={(e) => e.target === e.currentTarget && onClose && onClose()}
      >
        <div
          ref={ref}
          className={cx('rc-sheet', `rc-sheet-${side}`, leaving && 'is-leaving')}
          style={{ '--sheet-w': `${width}px` }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${tid}-t`}
          tabIndex={-1}
        >
          <span className="rc-sheet-grip" aria-hidden="true" />
          <header className="rc-sheet-head">
            <h2 id={`${tid}-t`} className="rc-dialog-title">
              {title}
            </h2>
            <IconButton icon="x" label="Fechar" onClick={onClose} />
          </header>
          <div className="rc-sheet-body">{children}</div>
          {footer && <footer className="rc-sheet-foot">{footer}</footer>}
        </div>
      </div>
    </Portal>
  );
}

/** Menu de ações com navegação por setas. */
export function Menu({ trigger, items, align = 'start', label = 'Mais ações' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);
  useEffect(() => {
    if (open && list.current) {
      const f = list.current.querySelector<HTMLElement>('[role=menuitem]');
      f && f.focus();
    }
  }, [open]);
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const els = [...list.current!.querySelectorAll<HTMLElement>('[role=menuitem]:not([disabled])')];
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      els[(i + 1) % els.length].focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      els[(i - 1 + els.length) % els.length].focus();
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };
  const t = trigger || <IconButton icon="more" label={label} />;
  return (
    <span className="rc-menu-wrap" ref={ref}>
      {React.cloneElement(t, { onClick: () => setOpen((o) => !o), 'aria-haspopup': 'menu', 'aria-expanded': open })}
      {open && (
        <div ref={list} className={cx('rc-menu', `rc-menu-${align}`)} role="menu" onKeyDown={onKey}>
          {items.map((it, i) =>
            it === '-' ? (
              <hr key={i} className="rc-menu-sep" />
            ) : (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                className={cx('rc-menu-item', it.tone === 'danger' && 'is-danger')}
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick && it.onClick();
                }}
              >
                {it.icon && <Icon name={it.icon} size={18} />}
                <span>{it.label}</span>
                {it.hint && <span className="rc-menu-hint">{it.hint}</span>}
              </button>
            ),
          )}
        </div>
      )}
    </span>
  );
}
