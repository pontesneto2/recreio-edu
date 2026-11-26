import type {
  AccordionProps,
  AvatarGroupProps,
  AvatarProps,
  BarChartProps,
  CardProps,
  DataTableProps,
  DescriptionListProps,
  ListItemProps,
  ListProps,
  MiniCalendarProps,
  SparklineProps,
  StatCardProps,
  TimelineProps,
} from './types';
import { useState, useEffect } from 'react';
import { cx, Icon, useCountUp, num } from './core';

/** Cartão. interactive=true quando o cartão inteiro leva a algum lugar. */
export function Card({
  title,
  subtitle,
  actions,
  children,
  footer,
  interactive,
  padding = 'md',
  className,
  as: Tag = 'section',
  onClick,
  href,
}: CardProps) {
  const T = href ? 'a' : Tag;
  return (
    <T
      className={cx('rc-card', `rc-card-pad-${padding}`, interactive && 'is-interactive', className)}
      href={href}
      onClick={onClick}
    >
      {(title || actions) && (
        <header className="rc-card-head">
          <div className="rc-card-titles">
            {title && <h3 className="rc-card-title">{title}</h3>}
            {subtitle && <p className="rc-card-sub">{subtitle}</p>}
          </div>
          {actions && <div className="rc-card-actions">{actions}</div>}
        </header>
      )}
      {children}
      {footer && <footer className="rc-card-foot">{footer}</footer>}
    </T>
  );
}

export const CATS = ['azul', 'verde', 'amarelo', 'laranja', 'vermelho', 'roxo', 'ciano', 'rosa'];
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export function Avatar({ name = '', src, size = 40, status, className }: AvatarProps) {
  const ini = name.trim().split(/\s+/).filter(Boolean);
  const txt = ((ini[0] || '')[0] || '') + ((ini.length > 1 ? ini[ini.length - 1][0] : '') || '');
  const cat = CATS[hash(name) % CATS.length];
  return (
    <span
      className={cx('rc-avatar', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {src ? (
        <img src={src} alt="" />
      ) : (
        <span className={cx('rc-avatar-ini', `rc-av-${cat}`)} aria-hidden="true">
          {txt.toUpperCase()}
        </span>
      )}
      <span className="rc-sr">{name}</span>
      {status && (
        <span
          className={cx('rc-avatar-status', `is-${status}`)}
          aria-label={status === 'online' ? 'Disponível' : 'Ausente'}
        />
      )}
    </span>
  );
}
export function AvatarGroup({ people = [], max = 4, size = 32 }: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="rc-avgroup" aria-label={`${people.length} pessoas`}>
      {shown.map((p) => (
        <Avatar key={p.name} name={p.name} src={p.photo} size={size} />
      ))}
      {rest > 0 && (
        <span className="rc-avatar rc-avatar-more" style={{ width: size, height: size }}>
          +{rest}
        </span>
      )}
    </span>
  );
}

export function Sparkline({ data = [], width = 96, height = 28, tone = 'brand', label }: SparklineProps) {
  const max = Math.max(...data),
    min = Math.min(...data);
  const sx = width / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [i * sx, height - 3 - ((v - min) / (max - min || 1)) * (height - 6)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <svg
      className={cx('rc-spark', `rc-spark-${tone}`)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={`${d} L${width} ${height} L0 ${height}Z`} className="rc-spark-area" />
      <path d={d} className="rc-spark-line" pathLength="1" />
      {pts.length > 0 && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" className="rc-spark-dot" />
      )}
    </svg>
  );
}

/** Indicador com número que conta até o valor, variação e tendência. */
/** color: categoria da cor (azul, verde, amarelo, laranja, vermelho, roxo, ciano, rosa). variant="hero": cartão em degradê marinho para o número principal da tela. */
export function StatCard({
  label,
  value,
  format = (v) => num(v),
  delta,
  deltaSuffix = '',
  deltaLabel,
  goodWhen = 'up',
  trend,
  icon,
  loading,
  href,
  hint,
  color = 'azul',
  variant,
}: StatCardProps) {
  const v = useCountUp(loading ? 0 : value || 0);
  const up = delta !== undefined && delta > 0;
  const good = delta === 0 ? null : goodWhen === 'up' ? up : !up;
  return (
    <a
      className={cx('rc-card', 'rc-stat', `rc-c-${color}`, variant === 'hero' && 'is-hero', href && 'is-interactive')}
      href={href}
      aria-busy={loading || undefined}
    >
      <div className="rc-stat-head">
        <p className="rc-stat-label">
          {icon && (
            <span className="rc-stat-ico">
              <Icon name={icon} size={20} />
            </span>
          )}
          {label}
        </p>
        {href && <Icon name="arrow-up-right" size={16} className="rc-stat-go" />}
      </div>
      {loading ? (
        <span className="rc-skel rc-skel-text" style={{ width: '60%', height: 32 }} />
      ) : (
        <p className="rc-stat-value">{format(v)}</p>
      )}
      <div className="rc-stat-foot">
        {delta != null && !loading && (
          <span className={cx('rc-stat-delta', good === true && 'is-good', good === false && 'is-bad')}>
            <Icon name={up ? 'arrow-up-right' : 'arrow-down-right'} size={14} />
            {`${Math.abs(delta).toLocaleString('pt-BR')}${deltaSuffix}`}
            {deltaLabel && <span className="rc-stat-dl">{deltaLabel}</span>}
          </span>
        )}
        {hint && <span className="rc-stat-hint">{hint}</span>}
        {trend && !loading && (
          <Sparkline data={trend} tone={trend[trend.length - 1] >= trend[0] ? 'success' : 'danger'} />
        )}
      </div>
    </a>
  );
}

/** Tabela de dados: ordenação, seleção, densidade, cabeçalho fixo, carregamento e vazio. */
export function DataTable({
  columns,
  rows,
  rowKey = 'id',
  selectable,
  selected = [],
  onSelect,
  sort,
  onSort,
  density = 'normal',
  loading,
  empty,
  onRowClick,
  caption,
  stickyHeader = true,
}: DataTableProps) {
  const all = rows.length > 0 && selected.length === rows.length;
  const some = selected.length > 0 && !all;
  const toggleAll = () => onSelect && onSelect(all ? [] : rows.map((r) => r[rowKey]));
  const toggle = (k: string | number) =>
    onSelect && onSelect(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k]);
  return (
    <div className={cx('rc-table-wrap', `rc-table-${density}`, stickyHeader && 'is-sticky')}>
      <table className="rc-table">
        {caption && <caption className="rc-sr">{caption}</caption>}
        <thead>
          <tr>
            {selectable && (
              <th className="rc-td-check">
                <label className="rc-check rc-check-bare">
                  <span className="rc-check-box">
                    <input
                      type="checkbox"
                      checked={all}
                      ref={(el) => {
                        if (el) el.indeterminate = some;
                      }}
                      onChange={toggleAll}
                      aria-label="Selecionar todos"
                    />
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path className="rc-check-mark" d="M3.5 8.5l3 3 6-6.5" />
                      <path className="rc-check-dash" d="M4 8h8" />
                    </svg>
                  </span>
                </label>
              </th>
            )}
            {columns.map((c) => {
              const s = sort && sort.key === c.key ? sort.dir : null;
              return (
                <th
                  key={c.key}
                  style={{ width: c.width, textAlign: c.align }}
                  aria-sort={s ? (s === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      className={cx('rc-th-sort', s && 'is-on')}
                      onClick={() => onSort && onSort({ key: c.key, dir: s === 'asc' ? 'desc' : 'asc' })}
                    >
                      {c.label}
                      <Icon name={s === 'desc' ? 'chevron-down' : 'chevron-up'} size={14} />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`sk${i}`} className="rc-tr-skel" aria-hidden="true">
                {selectable && <td />}
                {columns.map((c) => (
                  <td key={c.key}>
                    <span
                      className="rc-skel rc-skel-text"
                      style={{ width: `${45 + ((i * 17 + c.key.length * 7) % 45)}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="rc-td-empty">
                {empty || 'Nada por aqui ainda.'}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const k = r[rowKey];
              const on = selected.includes(k);
              return (
                <tr
                  key={k}
                  className={cx(on && 'is-selected', onRowClick && 'is-clickable')}
                  style={{ '--i': i }}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                >
                  {selectable && (
                    <td className="rc-td-check" onClick={(e) => e.stopPropagation()}>
                      <label className="rc-check rc-check-bare">
                        <span className="rc-check-box">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggle(k)}
                            aria-label={`Selecionar ${r[columns[0].key]}`}
                          />
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path className="rc-check-mark" d="M3.5 8.5l3 3 6-6.5" />
                            <path className="rc-check-dash" d="M4 8h8" />
                          </svg>
                        </span>
                      </label>
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align }} className={c.numeric ? 'is-num' : undefined}>
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function List({ children, divided = true, className, label }: ListProps) {
  return (
    <ul className={cx('rc-list', divided && 'is-divided', className)} aria-label={label}>
      {children}
    </ul>
  );
}
export function ListItem({
  leading,
  title,
  meta,
  trailing,
  onClick,
  href,
  unread,
  className,
  index = 0,
}: ListItemProps) {
  const T = href ? 'a' : onClick ? 'button' : 'div';
  return (
    <li className={cx('rc-li', unread && 'is-unread', className)} style={{ '--i': index }}>
      <T
        className={cx('rc-li-row', (href || onClick) && 'is-action')}
        href={href}
        onClick={onClick}
        type={T === 'button' ? 'button' : undefined}
      >
        {leading && <span className="rc-li-lead">{leading}</span>}
        <span className="rc-li-body">
          <span className="rc-li-title">{title}</span>
          {meta && <span className="rc-li-meta">{meta}</span>}
        </span>
        {trailing && <span className="rc-li-trail">{trailing}</span>}
      </T>
    </li>
  );
}

const KIND = {
  aula: 'book',
  tarefa: 'edit',
  comunicado: 'bell',
  pagamento: 'wallet',
  foto: 'image',
  refeicao: 'utensils',
  sono: 'bed',
  evento: 'calendar',
  saida: 'walk',
  nota: 'graduation',
  mensagem: 'chat',
};
/** Linha do tempo do dia. Itens entram em sequência; o agora fica marcado. */
export function Timeline({ items = [], nowIndex }: TimelineProps) {
  return (
    <ol className="rc-timeline">
      {items.map((it, i) => (
        <li
          key={it.id || i}
          className={cx(
            'rc-tl-item',
            `rc-tl-${it.tone || 'neutral'}`,
            i === nowIndex && 'is-now',
            it.done && 'is-done',
          )}
          style={{ '--i': i }}
        >
          <span className="rc-tl-time">{it.time}</span>
          <span className="rc-tl-node" aria-hidden="true">
            <Icon name={it.icon || KIND[it.kind as keyof typeof KIND] || 'info'} size={16} />
          </span>
          <div className="rc-tl-body">
            <p className="rc-tl-title">{it.title}</p>
            {it.meta && <p className="rc-tl-meta">{it.meta}</p>}
            {it.children}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DescriptionList({ items, columns = 2 }: DescriptionListProps) {
  return (
    <dl className="rc-dl" style={{ '--cols': columns }}>
      {items.map((it) => (
        <div key={it.label} className="rc-dl-item">
          <dt>{it.label}</dt>
          <dd>{it.value ?? <span className="rc-muted">Não informado</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Seções que abrem e fecham com animação de altura. */
export function Accordion({ items, multiple }: AccordionProps) {
  const [open, setOpen] = useState(() => items.filter((i) => i.open).map((i) => i.id));
  const tog = (id: string) =>
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : multiple ? [...o, id] : [id]));
  return (
    <div className="rc-acc">
      {items.map((it) => {
        const on = open.includes(it.id);
        return (
          <div key={it.id} className={cx('rc-acc-item', on && 'is-open')}>
            <h3 className="rc-acc-h">
              <button type="button" aria-expanded={on} aria-controls={`acc-${it.id}`} onClick={() => tog(it.id)}>
                <span className="rc-acc-title">
                  {it.title}
                  {it.meta && <span className="rc-acc-meta">{it.meta}</span>}
                </span>
                <Icon name="chevron-down" size={18} className="rc-acc-caret" />
              </button>
            </h3>
            <div className="rc-acc-panel" id={`acc-${it.id}`} role="region">
              <div className="rc-acc-inner">
                <div className="rc-acc-content">{it.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const WD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
/** Mês compacto com marcadores de evento. Hoje em destaque, dia selecionado em brand. */
export function MiniCalendar({ year, month, today, selected, events = {}, onSelect, onMonth }: MiniCalendarProps) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="rc-cal">
      <div className="rc-cal-head">
        <p className="rc-cal-title">
          {MONTHS[month]} de {year}
        </p>
        <span>
          <button
            type="button"
            className="rc-iconbtn rc-iconbtn-ghost rc-iconbtn-sm"
            aria-label="Mês anterior"
            onClick={() => onMonth && onMonth(-1)}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            className="rc-iconbtn rc-iconbtn-ghost rc-iconbtn-sm"
            aria-label="Próximo mês"
            onClick={() => onMonth && onMonth(1)}
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </span>
      </div>
      <div className="rc-cal-grid" role="grid" aria-label={`${MONTHS[month]} de ${year}`}>
        {WD.map((d, i) => (
          <span key={`w${i}`} className="rc-cal-wd" aria-hidden="true">
            {d}
          </span>
        ))}
        {cells.map((d, i) =>
          d == null ? (
            <span key={`x${i}`} />
          ) : (
            <button
              key={d}
              type="button"
              role="gridcell"
              className={cx('rc-cal-day', d === today && 'is-today', d === selected && 'is-sel')}
              aria-selected={d === selected}
              aria-label={`${d} de ${MONTHS[month]}${events[d] ? `, ${events[d].length} evento${events[d].length > 1 ? 's' : ''}` : ''}`}
              onClick={() => onSelect && onSelect(d)}
            >
              {d}
              {events[d] && (
                <span className="rc-cal-dots" aria-hidden="true">
                  {events[d].slice(0, 3).map((t, j) => (
                    <span key={j} className={`rc-cal-dot rc-dot-${t}`} />
                  ))}
                </span>
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

/** Barras verticais simples, com valor no topo e linha de referência opcional. Cresce ao aparecer. */
export function BarChart({
  data = [],
  height = 160,
  format = (v) => num(v),
  reference,
  referenceLabel,
  label,
  highlight,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), reference || 0) * 1.12 || 1;
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return (
    <figure className="rc-bars" aria-label={label}>
      <div className="rc-bars-plot" style={{ height }}>
        {reference != null && (
          <div className="rc-bars-ref" style={{ bottom: `${(reference / max) * 100}%` }}>
            <span>{referenceLabel || format(reference)}</span>
          </div>
        )}
        {data.map((d, i) => (
          <div key={d.label} className="rc-bars-col">
            <span className="rc-bars-val">{format(d.value)}</span>
            <span
              className={cx('rc-bars-bar', (highlight === d.label || d.highlight) && 'is-hl', d.tone && `is-${d.tone}`)}
              style={{
                height: `${(d.value / max) * 100}%`,
                transform: grown ? 'scaleY(1)' : 'scaleY(0)',
                transitionDelay: `${i * 40}ms`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="rc-bars-axis">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      <table className="rc-sr">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th>{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
