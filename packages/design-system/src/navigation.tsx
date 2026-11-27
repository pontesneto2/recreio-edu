import type {
  CommandItem,
  AppShellProps,
  BreadcrumbsProps,
  CommandPaletteProps,
  PaginationProps,
  ProfileSwitcherProps,
  SideNavProps,
  StepperProps,
  TabBarProps,
  TabsProps,
  TopBarProps,
} from './types';
import { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import { cx, Icon, SchoolMark, MadeBy, Portal, useFocusTrap, useOnClickOutside, useUid, useBrand } from './core';
import { IconButton, Kbd } from './actions';
import { Avatar } from './data';

/** Navegação lateral do desktop: grupos, item ativo com marcador animado, contadores. */
const NAV_KEY = 'recreio.menu';
const readNav = () => {
  try {
    return window.localStorage.getItem(NAV_KEY) === 'recolhido';
  } catch {
    return false;
  }
};
export function SideNav({
  school: school0 = { name: 'Colégio Recreio' },
  units,
  groups = [],
  active,
  onNavigate,
  footer,
  collapsed: collapsed0,
  collapsible = true,
  onCollapse,
}: SideNavProps) {
  const [col, setCol] = useState(() => (collapsed0 != null ? !!collapsed0 : readNav()));
  const [prevCollapsed, setPrevCollapsed] = useState(collapsed0);
  if (collapsed0 !== prevCollapsed) {
    setPrevCollapsed(collapsed0);
    if (collapsed0 != null) setCol(!!collapsed0);
  }
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === NAV_KEY && collapsed0 == null) setCol(readNav());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [collapsed0]);
  const toggle = () => {
    const n = !col;
    setCol(n);
    // Condicionais ficam fora do try: o React Compiler ainda não compila esse caso.
    const salvo = n ? 'recolhido' : 'aberto';
    try {
      window.localStorage.setItem(NAV_KEY, salvo);
    } catch {
      /* vale só nesta tela */
    }
    onCollapse && onCollapse(n);
  };
  const collapsed = col;
  const brand = useBrand();
  const school =
    brand && (brand.name || brand.symbol || brand.logoDark)
      ? { ...school0, name: brand.name || school0.name, logo: brand.symbol || brand.logoDark || school0.logo }
      : school0;
  const ref = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<{ top: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current && ref.current.querySelector<HTMLElement>('.rc-nav-item.is-active');
    if (el) setMark({ top: el.offsetTop, height: el.offsetHeight });
    else setMark(null);
  }, [active, collapsed]);
  return (
    <nav className={cx('rc-sidenav', collapsed && 'is-collapsed')} aria-label="Navegação principal">
      {collapsible && (
        <button
          type="button"
          className="rc-sidenav-toggle"
          aria-label={collapsed ? 'Abrir o menu' : 'Recolher o menu, mostrar só os ícones'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Abrir o menu' : 'Recolher o menu'}
          onClick={toggle}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} strokeWidth={2.5} />
        </button>
      )}
      <div className="rc-sidenav-head">
        {units && units.length && !collapsed ? (
          <details className="rc-sidenav-units">
            {/* O nome vem do texto visível (regra label-content-name-mismatch do axe): a frase escondida diz a ação. */}
            <summary className="rc-sidenav-school">
              <span className="rc-sr">Trocar unidade. Atual: </span>
              <SchoolMark name={school.name} src={school.logo} size={36} decorative />
              <div className="rc-sidenav-school-text">
                <p className="rc-sidenav-school-name">{school.name}</p>
                {school.unit && <p className="rc-sidenav-school-unit">{school.unit}</p>}
              </div>
              <Icon name="chevron-down" size={18} className="rc-sidenav-units-chev" />
            </summary>
            <div className="rc-sidenav-units-panel" role="menu">
              <p className="rc-sidenav-units-title">Trocar unidade</p>
              {units.map((u) => (
                <a
                  key={u.id}
                  role="menuitem"
                  href={u.href || '#'}
                  className={cx('rc-sidenav-unit', u.current && 'is-current')}
                  aria-current={u.current ? 'true' : undefined}
                >
                  <span className="rc-sidenav-unit-text">
                    <strong>{u.label}</strong>
                    {u.meta && <small>{u.meta}</small>}
                  </span>
                  {u.current && <Icon name="check" size={18} />}
                </a>
              ))}
            </div>
          </details>
        ) : (
          <div className="rc-sidenav-school">
            <SchoolMark name={school.name} src={school.logo} size={36} decorative={!collapsed} />
            {!collapsed && (
              <div className="rc-sidenav-school-text">
                <p className="rc-sidenav-school-name">{school.name}</p>
                {school.unit && <p className="rc-sidenav-school-unit">{school.unit}</p>}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="rc-sidenav-scroll" ref={ref}>
        {mark && (
          <span
            className="rc-nav-mark"
            style={{ transform: `translateY(${mark.top}px)`, height: mark.height }}
            aria-hidden="true"
          />
        )}
        {groups.map((g) => (
          <div key={g.label || 'g'} className="rc-nav-group">
            {g.label &&
              (collapsed ? (
                <span className="rc-nav-group-rule" aria-hidden="true" />
              ) : (
                <p className="rc-nav-group-label">{g.label}</p>
              ))}
            {g.items.map((it) => (
              <a
                key={it.id}
                href={it.href || '#'}
                className={cx('rc-nav-item', active === it.id && 'is-active')}
                aria-current={active === it.id ? 'page' : undefined}
                title={collapsed ? it.label : undefined}
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate(it.id);
                  }
                }}
              >
                <Icon name={it.icon} size={20} />
                {!collapsed && <span className="rc-nav-label">{it.label}</span>}
                {it.count ? <span className={cx('rc-nav-count', it.urgent && 'is-urgent')}>{it.count}</span> : null}
              </a>
            ))}
          </div>
        ))}
      </div>
      {footer !== null && !collapsed && <div className="rc-sidenav-foot">{footer || <MadeBy />}</div>}
    </nav>
  );
}

/** Barra inferior do celular: até 5 destinos, pílula ativa animada. */
export function TabBar({ items = [], active, onNavigate }: TabBarProps) {
  return (
    <nav className="rc-tabbar" aria-label="Navegação principal">
      {items.slice(0, 5).map((it) => (
        <a
          key={it.id}
          href={it.href || '#'}
          className={cx('rc-tabbar-item', active === it.id && 'is-active')}
          aria-current={active === it.id ? 'page' : undefined}
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate(it.id);
            }
          }}
        >
          <span className="rc-tabbar-icon">
            <Icon name={it.icon} size={22} />
            {it.count ? <span className="rc-tabbar-count">{it.count}</span> : null}
          </span>
          <span className="rc-tabbar-label">{it.label}</span>
        </a>
      ))}
    </nav>
  );
}

/** Seletor de perfil e de filho no topo. Uma pessoa pode ser mãe e professora na mesma conta. */
export function ProfileSwitcher({
  user = { name: 'Fernanda Lima' },
  profiles = [],
  dependents: kids = [],
  activeProfile,
  activeChild,
  onProfile,
  onChild,
  onLogout,
  defaultOpen = false,
}: ProfileSwitcherProps) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);
  const child = kids.find((k) => k.id === activeChild);
  return (
    <div className="rc-profsw" ref={ref}>
      <button
        type="button"
        className="rc-profsw-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar name={child ? child.name : user.name} src={child ? child.photo : user.photo} size={32} />
        <span className="rc-profsw-text">
          <span className="rc-profsw-name">{child ? child.name.split(' ')[0] : user.name.split(' ')[0]}</span>
          <span className="rc-profsw-role">
            {child ? child.group : (profiles.find((p) => p.id === activeProfile) || {}).label}
          </span>
        </span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <div className="rc-profsw-pop" role="dialog" aria-label="Trocar perfil">
          {kids.length > 0 && <p className="rc-nav-group-label">Filhos</p>}
          {kids.map((k) => (
            <button
              key={k.id}
              type="button"
              className={cx('rc-profsw-opt', k.id === activeChild && 'is-on')}
              onClick={() => {
                onChild && onChild(k.id);
                setOpen(false);
              }}
            >
              <Avatar name={k.name} src={k.photo} size={32} />
              <span className="rc-profsw-opt-text">
                <span>{k.name}</span>
                <span className="rc-profsw-role">{k.group}</span>
              </span>
              {k.id === activeChild && <Icon name="check" size={18} />}
            </button>
          ))}
          {profiles.length > 1 && <p className="rc-nav-group-label">Entrar como</p>}
          {profiles.length > 1 &&
            profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className={cx('rc-profsw-opt', p.id === activeProfile && 'is-on')}
                onClick={() => {
                  onProfile && onProfile(p.id);
                  setOpen(false);
                }}
              >
                <span className="rc-profsw-ico">
                  <Icon name={p.icon || 'user'} size={18} />
                </span>
                <span className="rc-profsw-opt-text">
                  <span>{p.label}</span>
                  {p.school && <span className="rc-profsw-role">{p.school}</span>}
                </span>
                {p.id === activeProfile && <Icon name="check" size={18} />}
              </button>
            ))}
          <hr className="rc-menu-sep" />
          <button type="button" className="rc-profsw-opt" onClick={onLogout}>
            <span className="rc-profsw-ico">
              <Icon name="logout" size={18} />
            </span>
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  );
}

/** Barra superior: título da página, busca, notificações e perfil. */
export function TopBar({ title, subtitle, search, actions, profile, onMenu, sticky = true }: TopBarProps) {
  return (
    <header className={cx('rc-topbar', sticky && 'is-sticky')}>
      {onMenu && <IconButton icon="menu" label="Abrir menu" onClick={onMenu} className="rc-topbar-menu" />}
      <div className="rc-topbar-titles">
        {title && <h1 className="rc-topbar-title">{title}</h1>}
        {subtitle && <p className="rc-topbar-sub">{subtitle}</p>}
      </div>
      {search && <div className="rc-topbar-search">{search}</div>}
      <div className="rc-topbar-actions">
        {actions}
        {profile}
      </div>
    </header>
  );
}

/** Esqueleto da aplicação: lateral no desktop, barra inferior no celular. */
export function AppShell({ sidenav, topbar, tabbar, children, aside }: AppShellProps) {
  return (
    <div className={cx('rc-shell', aside && 'has-aside')}>
      <div className="rc-shell-side">{sidenav}</div>
      <div className="rc-shell-main">
        {topbar}
        <main className="rc-shell-content" id="conteudo">
          {children}
        </main>
      </div>
      {aside && (
        <aside className="rc-shell-aside" data-secondary>
          {aside}
        </aside>
      )}
      <div className="rc-shell-tabbar">{tabbar}</div>
    </div>
  );
}

/** Abas com sublinhado que desliza. Setas trocam de aba. */
export function Tabs({ tabs, value, onChange, label, size = 'md' }: TabsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const idx = Math.max(
    0,
    tabs.findIndex((t) => t.id === value),
  );
  useLayoutEffect(() => {
    const el = ref.current && ref.current.querySelectorAll<HTMLElement>('.rc-tab')[idx];
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
  }, [idx, tabs.length]);
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (idx + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange && onChange(tabs[n].id);
    ref.current!.querySelectorAll<HTMLElement>('.rc-tab')[n].focus();
  };
  return (
    <div className={cx('rc-tabs', `rc-tabs-${size}`)} role="tablist" aria-label={label} ref={ref} onKeyDown={onKey}>
      {tabs.map((t, i) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={i === idx}
          tabIndex={i === idx ? 0 : -1}
          className={cx('rc-tab', i === idx && 'is-on')}
          onClick={() => onChange && onChange(t.id)}
        >
          {t.icon && <Icon name={t.icon} size={18} />}
          <span>{t.label}</span>
          {t.count != null && <span className="rc-tab-count">{t.count}</span>}
        </button>
      ))}
      {bar && (
        <span
          className="rc-tabs-bar"
          style={{ transform: `translateX(${bar.left}px)`, width: bar.width }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Você está em" className="rc-crumbs">
      <ol>
        {items.map((it, i) => (
          <li key={it.label}>
            {i < items.length - 1 ? (
              <>
                <a href={it.href || '#'}>{it.label}</a>
                <Icon name="chevron-right" size={14} />
              </>
            ) : (
              <span aria-current="page">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({ page, pages, onChange, total, pageSize, label = 'itens' }: PaginationProps) {
  const nums = useMemo(() => {
    const s = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
    const arr = [...s].sort((a, b) => a - b);
    const out: Array<number | '…'> = [];
    arr.forEach((n, i) => {
      if (i && n - arr[i - 1] > 1) out.push('…');
      out.push(n);
    });
    return out;
  }, [page, pages]);
  const from = (page - 1) * (pageSize || 0) + 1;
  const to = Math.min(total || 0, page * (pageSize || 0));
  return (
    <nav className="rc-pager" aria-label="Paginação">
      {total != null && (
        <p className="rc-pager-info">
          {from} a {to} de {total.toLocaleString('pt-BR')} {label}
        </p>
      )}
      <div className="rc-pager-btns">
        <IconButton
          icon="chevron-left"
          label="Página anterior"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        />
        {nums.map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className="rc-pager-gap">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={cx('rc-pager-n', n === page && 'is-on')}
              aria-current={n === page ? 'page' : undefined}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ),
        )}
        <IconButton
          icon="chevron-right"
          label="Próxima página"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        />
      </div>
    </nav>
  );
}

/** Etapas de um fluxo (rematrícula, matrícula). Mostra onde a pessoa está e quanto falta. */
export function Stepper({ steps, current = 0, orientation = 'horizontal' }: StepperProps) {
  return (
    <ol
      className={cx('rc-stepper', `rc-stepper-${orientation}`)}
      aria-label={`Etapa ${current + 1} de ${steps.length}`}
    >
      {steps.map((s, i) => {
        const st = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={s.label} className={cx('rc-step', `is-${st}`)} aria-current={st === 'current' ? 'step' : undefined}>
            <span className="rc-step-dot">
              {st === 'done' ? <Icon name="check" size={14} strokeWidth={2.5} /> : i + 1}
            </span>
            <span className="rc-step-text">
              <span className="rc-step-label">{s.label}</span>
              {s.hint && <span className="rc-step-hint">{s.hint}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Busca global (Ctrl K): pessoas, telas e ações, tudo pelo teclado. */
export function CommandPalette({
  open,
  onClose,
  groups = [],
  placeholder = 'Buscar aluno, responsável, turma ou ação',
  onSelect,
}: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const lid = useUid('cmd');
  useFocusTrap(ref, open);
  const flat = useMemo(() => {
    const t = q.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => !t || (it.label + ' ' + (it.meta || '')).toLowerCase().includes(t)),
      }))
      .filter((g) => g.items.length);
  }, [q, groups]);
  const all = flat.flatMap((g) => g.items);
  // Posição do primeiro item de cada grupo na lista corrida, para o destaque do teclado.
  const starts = flat.map((_, gi) => flat.slice(0, gi).reduce((s, g) => s + g.items.length, 0));
  // Fechada, a busca volta vazia e o destaque volta ao topo; sem texto digitado, o destaque fica onde estava.
  if (!open && q !== '') {
    setQ('');
    setI(0);
  }
  if (!open) return null;
  const pick = (it: CommandItem) => {
    onSelect && onSelect(it);
    onClose && onClose();
  };
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setI((x) => Math.min(all.length - 1, x + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setI((x) => Math.max(0, x - 1));
    }
    if (e.key === 'Enter' && all[i]) pick(all[i]);
    if (e.key === 'Escape') onClose && onClose();
  };
  return (
    <Portal>
      <div
        className="rc-overlay rc-overlay-top"
        onMouseDown={(e) => e.target === e.currentTarget && onClose && onClose()}
      >
        <div ref={ref} className="rc-cmd" role="dialog" aria-modal="true" aria-label="Busca global" onKeyDown={onKey}>
          <div className="rc-cmd-input">
            <Icon name="search" size={20} />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setI(0);
              }}
              placeholder={placeholder}
              role="combobox"
              aria-expanded="true"
              aria-controls={lid}
              aria-activedescendant={all[i] ? `${lid}-${i}` : undefined}
            />
            <Kbd>Esc</Kbd>
          </div>
          <div className="rc-cmd-list" role="listbox" id={lid}>
            {flat.length === 0 && (
              <p className="rc-cmd-empty">Nada encontrado para “{q}”. Tente o nome, a matrícula ou a turma.</p>
            )}
            {flat.map((g, gi) => (
              <div key={g.label} role="group" aria-label={g.label}>
                <p className="rc-nav-group-label">{g.label}</p>
                {g.items.map((it, j) => {
                  const k = starts[gi] + j;
                  return (
                    <div
                      key={it.id || it.label}
                      id={`${lid}-${k}`}
                      role="option"
                      aria-selected={k === i}
                      className={cx('rc-cmd-item', k === i && 'is-on')}
                      onMouseEnter={() => setI(k)}
                      onClick={() => pick(it)}
                    >
                      {it.avatar ? (
                        <Avatar name={it.label} size={28} />
                      ) : (
                        <span className="rc-cmd-ico">
                          <Icon name={it.icon || 'arrow-right'} size={18} />
                        </span>
                      )}
                      <span className="rc-cmd-text">
                        <span>{it.label}</span>
                        {it.meta && <span className="rc-cmd-meta">{it.meta}</span>}
                      </span>
                      {it.shortcut && <Kbd>{it.shortcut}</Kbd>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="rc-cmd-foot">
            <span>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navegar
            </span>
            <span>
              <Kbd>Enter</Kbd> abrir
            </span>
          </div>
        </div>
      </div>
    </Portal>
  );
}
