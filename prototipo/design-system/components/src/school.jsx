import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cx, Icon, brl, num, Logo, MadeBy, SchoolMark, schoolPalette, contrast, usePreferences, useReducedMotion, useUid, useCountUp, useBrand, brandVars, saveBrand, loadBrand, isHex, useToast } from './core.jsx';
import { Button, IconButton, CopyButton, SegmentedControl, Spinner } from './actions.jsx';
import { StatusPill, Badge, ProgressBar, Dialog, Alert, useUnsaved } from './feedback.jsx';
import { Avatar } from './data.jsx';
import { Switch, Slider, RadioGroup, TextField, FilterChips, Select } from './inputs.jsx';

const PEND_ICON = { pagamento: 'wallet', assinatura: 'edit', autorizacao: 'shield', enquete: 'list', leitura: 'eye', documento: 'file-text', reuniao: 'calendar' };
/** Uma pendência da família: o que fazer, até quando, e o botão para resolver ali mesmo. */
export function PendingItem({ kind = 'pagamento', title, child, due, dueTone = 'neutral', amount, actionLabel = 'Resolver', onAction, done, index = 0 }) {
  return (
    <li className={cx('rc-pend', done && 'is-done')} style={{ '--i': index }}>
      <span className={cx('rc-pend-ico', `rc-tone-${dueTone}`)}><Icon name={done ? 'check' : PEND_ICON[kind] || 'info'} size={20} /></span>
      <div className="rc-pend-body">
        <p className="rc-pend-title">{title}</p>
        <p className="rc-pend-meta">{child && <span>{child}</span>}{due && <span className={cx('rc-pend-due', `is-${dueTone}`)}><Icon name="clock" size={14} />{due}</span>}</p>
      </div>
      {amount != null && <span className="rc-pend-amount">{brl(amount)}</span>}
      {done ? <StatusPill tone="success" size="sm">Feito</StatusPill> : <Button size="sm" variant={dueTone === 'danger' ? 'primary' : 'secondary'} onClick={onAction}>{actionLabel}</Button>}
    </li>
  );
}

const PRIO = { urgente: { tone: 'danger', label: 'Urgente', icon: 'alert' }, importante: { tone: 'warning', label: 'Importante', icon: 'flag' }, rotina: { tone: 'neutral', label: 'Rotina', icon: 'info' } };
/** Comunicado: prioridade, quem enviou, leitura confirmada, ouvir, traduzir, Libras e PDF. */
export function AnnouncementCard({ title, from, date, priority = 'rotina', summary, children, read, requireConfirm, onConfirm, attachments = [], libras, expanded: exp0 = false, image }) {
  const { prefs } = usePreferences();
  const simple = prefs && prefs.reading === 'simples';
  const [exp, setExp] = useState(exp0 || !simple);
  const [confirmed, setConfirmed] = useState(!!read);
  const [speaking, setSpeaking] = useState(false);
  const p = PRIO[priority] || PRIO.rotina;
  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(`${title}. ${summary || ''}`); u.lang = 'pt-BR'; u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u); setSpeaking(true);
  };
  return (
    <article className={cx('rc-card', 'rc-annc', `rc-annc-${priority}`, !confirmed && 'is-unread')}>
      <header className="rc-annc-head">
        <StatusPill tone={p.tone} icon={p.icon} size="sm">{p.label}</StatusPill>
        <span className="rc-annc-from">{from}</span><span className="rc-annc-date">{date}</span>
        {!confirmed && <Badge dot tone="brand" label="Não lido" />}
      </header>
      <h3 className="rc-annc-title">{title}</h3>
      {summary && <p className="rc-annc-summary">{summary}</p>}
      {image && <img className="rc-annc-img" src={image.src} alt={image.alt} />}
      {children && (exp ? <div className="rc-annc-body">{children}</div> : <button type="button" className="rc-link" onClick={() => setExp(true)}>Ler o comunicado inteiro</button>)}
      {attachments.length > 0 && <ul className="rc-annc-files">{attachments.map((a) => <li key={a.name}><a href={a.href || '#'} className="rc-annc-file"><Icon name="paperclip" size={16} />{a.name}<span className="rc-muted">{a.size}</span></a></li>)}</ul>}
      <footer className="rc-annc-foot">
        <div className="rc-annc-tools">
          <IconButton icon={speaking ? 'pause' : 'volume'} label={speaking ? 'Parar leitura' : 'Ouvir comunicado'} size="sm" onClick={speak} />
          <IconButton icon="translate" label="Traduzir" size="sm" />
          {libras && <IconButton icon="hand" label="Ver em Libras" size="sm" />}
          <IconButton icon="download" label="Baixar PDF" size="sm" />
        </div>
        {requireConfirm && (confirmed
          ? <span className="rc-annc-ok"><Icon name="check-circle" size={18} />Leitura confirmada</span>
          : <Button size="sm" variant="primary" icon="check" onClick={() => { setConfirmed(true); onConfirm && onConfirm(); }}>Confirmar leitura</Button>)}
      </footer>
    </article>
  );
}

const INV = { aberta: { tone: 'info', label: 'Em aberto', icon: 'clock' }, avencer: { tone: 'warning', label: 'Vence em breve', icon: 'clock' }, vencida: { tone: 'danger', label: 'Vencida', icon: 'alert' },
  paga: { tone: 'success', label: 'Paga', icon: 'check-circle' }, compensando: { tone: 'info', label: 'Compensando', icon: 'sync' }, negociada: { tone: 'neutral', label: 'Negociada', icon: 'file-text' } };
/** Mensalidade ou cobrança: competência, valor, vencimento, status e o caminho para pagar. */
export function InvoiceCard({ competence, description, amount, due, status = 'aberta', child, fine, discount, onPay, onReceipt, compact }) {
  const s = INV[status] || INV.aberta; const paid = status === 'paga';
  return (
    <div className={cx('rc-card', 'rc-inv', `rc-inv-${status}`, compact && 'is-compact')}>
      <div className="rc-inv-top">
        <div><p className="rc-inv-comp">{competence}</p><p className="rc-inv-desc">{description}{child && ` · ${child}`}</p></div>
        <StatusPill tone={s.tone} icon={s.icon} size="sm">{s.label}</StatusPill>
      </div>
      <p className="rc-inv-amount">{brl(amount)}</p>
      <p className="rc-inv-due">{paid ? `Paga em ${due}` : `Vence ${due}`}{discount && !paid ? <span className="rc-inv-disc"> · {brl(discount)} de desconto até o vencimento</span> : null}{fine && status === 'vencida' ? <span className="rc-inv-fine"> · inclui {brl(fine)} de multa e juros</span> : null}</p>
      <div className="rc-inv-actions">
        {paid ? <Button variant="ghost" size="sm" icon="download" onClick={onReceipt}>Comprovante</Button>
          : <><Button variant="primary" size="sm" icon="qr" onClick={() => onPay && onPay('pix')}>Pagar com Pix</Button>
            <Button variant="ghost" size="sm" icon="barcode" onClick={() => onPay && onPay('boleto')}>Boleto</Button>
            <Button variant="ghost" size="sm" icon="card" onClick={() => onPay && onPay('cartao')}>Cartão</Button></>}
      </div>
    </div>
  );
}

/* QR ilustrativo determinístico (não é um QR real): só para protótipo. */
export const FakeQR = ({ seed = 'pix', size = 176, label = 'QR Code do Pix' }) => {
  const n = 25; const cells = [];
  let h = [...seed].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381);
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  const F = ({ x, y }) => <g><rect x={x} y={y} width="7" height="7" rx="1.2" className="rc-qr-f" /><rect x={x + 1} y={y + 1} width="5" height="5" rx=".8" className="rc-qr-bg" /><rect x={x + 2} y={y + 2} width="3" height="3" rx=".6" className="rc-qr-f" /></g>;
  return <svg className="rc-qr" width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label={label}><rect x="-1" y="-1" width={n + 2} height={n + 2} className="rc-qr-bg" rx="1.5" /><g className="rc-qr-m">{cells}</g><F x={0} y={0} /><F x={n - 7} y={0} /><F x={0} y={n - 7} /></svg>;
};
/** Pagamento por Pix: QR, copia e cola, contagem do prazo e confirmação animada. */
export function PixPayment({ amount, code = '00020126580014br.gov.bcb.pix0136a3f5c9e2-7b41-4d8e-9c1a-2f6b8e0d4c7a5204000053039865406', expiresIn = 1800, status: st0 = 'aguardando', payee = 'Colégio Recreio', reference, onDone }) {
  const [left, setLeft] = useState(expiresIn); const [status, setStatus] = useState(st0);
  useEffect(() => setStatus(st0), [st0]);
  useEffect(() => { if (status !== 'aguardando') return; const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000); return () => clearInterval(t); }, [status]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0'); const ss = String(left % 60).padStart(2, '0');
  if (status === 'pago') {
    return (
      <div className="rc-pix rc-pix-done" role="status">
        <svg className="rc-pix-check" viewBox="0 0 64 64" width="72" height="72" aria-hidden="true"><circle cx="32" cy="32" r="28" /><path d="M20 33l8 8 16-18" /></svg>
        <p className="rc-pix-done-title">Pagamento recebido</p>
        <p className="rc-pix-done-text">{brl(amount)} para {payee}. O comprovante já está no seu financeiro.</p>
        <div className="rc-pix-actions"><Button variant="secondary" icon="download">Baixar comprovante</Button><Button variant="ghost" onClick={onDone}>Voltar</Button></div>
      </div>
    );
  }
  return (
    <div className="rc-pix">
      <div className="rc-pix-head"><p className="rc-pix-label">Valor</p><p className="rc-pix-amount">{brl(amount)}</p><p className="rc-pix-payee">Para {payee}{reference && ` · ${reference}`}</p></div>
      <div className="rc-pix-qrbox"><FakeQR seed={code} /></div>
      <ol className="rc-pix-steps"><li>Abra o app do seu banco e escolha pagar com Pix.</li><li>Leia o QR Code ou cole o código abaixo.</li><li>Confira o valor e o nome da escola, e confirme.</li></ol>
      <div className="rc-pix-code"><code>{code}</code></div>
      <CopyButton text={code} label="Copiar código Pix" copiedLabel="Código copiado" variant="primary" full />
      <div className="rc-pix-status"><Spinner size={16} label="Aguardando pagamento" /><span>Aguardando pagamento · expira em <strong className="rc-tnum">{mm}:{ss}</strong></span></div>
      <p className="rc-pix-note">Esta tela atualiza sozinha quando o pagamento cair. Não precisa enviar comprovante.</p>
    </div>
  );
}

/** Boletim: média por disciplina, frequência e evolução por etapa. */
export function ReportCard({ term = '3º bimestre', min = 6, subjects = [] }) {
  return (
    <div className="rc-report">
      <div className="rc-report-head"><p className="rc-overline">{term}</p><p className="rc-report-legend"><span className="rc-report-min" />média para aprovação: {num(min, 1)}</p></div>
      <ul className="rc-report-list">
        {subjects.map((s, i) => {
          const low = s.grade != null && s.grade < min; const freqLow = s.attendance != null && s.attendance < 75;
          return (
            <li key={s.name} className="rc-report-row" style={{ '--i': i }}>
              <div className="rc-report-name"><p>{s.name}</p><p className="rc-muted">{s.teacher}</p></div>
              <div className="rc-report-bar" aria-hidden="true"><span className={cx(low && 'is-low')} style={{ width: `${(s.grade || 0) * 10}%` }} /><i style={{ left: `${min * 10}%` }} /></div>
              <div className="rc-report-grade">
                <span className={cx('rc-report-num', low && 'is-low')}>{s.grade == null ? <span className="rc-sr">sem nota</span> : num(s.grade, 1)}</span>
                {s.delta != null && s.delta !== 0 && <span className={cx('rc-report-delta', s.delta > 0 ? 'is-up' : 'is-down')}><Icon name={s.delta > 0 ? 'arrow-up-right' : 'arrow-down-right'} size={12} />{num(Math.abs(s.delta), 1)}</span>}
              </div>
              <span className={cx('rc-report-freq', freqLow && 'is-low')}>{s.attendance != null ? `${s.attendance}%` : ''}<span className="rc-sr"> de frequência</span></span>
              {low && <span className="rc-sr">abaixo da média</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Lançamento de notas como planilha: setas e Enter navegam, colar do Excel, validação na hora. */
/** Digitação de notas e faltas do período. Faltas não entram na média. */
export function GradeEntry({ students = [], assessments = [], values: v0 = {}, max = 10, onChange, onSave, saving: saving0, absences = false, maxAbsences = 200 }) {
  const [vals, setVals] = useState(v0);
  const [base, setBase] = useState(v0);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const toast = useToast();
  const saving = saving0 || busy;
  const ref = useRef(null);
  const key = (s, a) => `${s}:${a}`;
  const parse = (x) => { const t = String(x).replace(',', '.').trim(); if (t === '') return ''; const n = Number(t); return Number.isFinite(n) ? n : NaN; };
  const invalid = (raw) => { const n = parse(raw ?? ''); return n !== '' && (Number.isNaN(n) || n < 0 || n > max); };
  const badAbs = (raw) => { const n = parse(raw ?? ''); return n !== '' && (Number.isNaN(n) || n < 0 || n > maxAbsences || !Number.isInteger(n)); };
  /* Só aceita o que cabe: nota de 0 a max com até 2 casas, falta inteira. Digitação fora da faixa é ignorada; colagem fora da faixa vira o limite. */
  const clean = (raw, abs, clamp) => {
    let t = String(raw ?? '').trim();
    if (abs) { t = t.replace(/\D/g, ''); if (t === '') return ''; const n = Number(t); return n > maxAbsences ? (clamp ? String(maxAbsences) : null) : String(n); }
    t = t.replace(/[^0-9.,]/g, ''); if (t === '') return '';
    const sep = t.search(/[.,]/); if (sep >= 0) t = t.slice(0, sep + 1) + t.slice(sep + 1).replace(/[.,]/g, '').slice(0, 2);
    const n = parse(t); if (Number.isNaN(n)) return null;
    return n > max ? (clamp ? String(max) : null) : t;
  };
  const cols = absences ? [...assessments, { id: 'faltas', label: 'Faltas', absences: true }] : assessments;
  const set = (s, a, raw, clamp) => { const k = key(s, a); const v = clean(raw, a === 'faltas', clamp); if (v === null) return; setVals((o) => { const nv = { ...o, [k]: v }; onChange && onChange(nv); return nv; }); };
  const move = (r, c) => { const el = ref.current.querySelector(`[data-cell="${r}-${c}"]`); el && el.focus(); el && el.select && el.select(); };
  const onKey = (e, r, c) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); move(r + 1, c); }
    if (e.key === 'ArrowUp') { e.preventDefault(); move(r - 1, c); }
    if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) move(r, c + 1);
    if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) move(r, c - 1);
  };
  const onPaste = (e, r, c) => {
    const txt = e.clipboardData.getData('text'); if (!/[\t\n]/.test(txt)) return; e.preventDefault();
    txt.trim().split(/\r?\n/).forEach((line, dr) => line.split('\t').forEach((cell, dc) => { const s = students[r + dr]; const a = cols[c + dc]; if (s && a) set(s.id, a.id, cell, true); }));
  };
  const avg = (s) => { let sum = 0, w = 0; assessments.forEach((a) => { const raw = vals[key(s.id, a.id)] ?? ''; const n = parse(raw); if (n !== '' && !invalid(raw)) { sum += n * (a.weight || 1); w += a.weight || 1; } }); return w ? sum / w : null; };
  const dirty = Object.keys(vals).filter((k) => String(vals[k] ?? '') !== String(base[k] ?? '')).length;
  const save = () => { setBusy(true); setTimeout(() => { const d = new Date(); setBusy(false); setBase(vals); setSavedAt(`${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`); toast.show({ tone: 'success', title: 'Notas salvas', message: 'A família só vê depois que você liberar as notas.' }); onSave && onSave(vals); }, 600); };
  const leave = useUnsaved(dirty > 0, { onSave: () => { setBase(vals); onSave && onSave(vals); } });
  return (
    <div className="rc-grades" ref={ref}>
      <div className="rc-grades-bar"><span className="rc-muted">Setas e Enter movem entre células. Cole direto do Excel.</span></div>
      <div className="rc-table-wrap is-sticky">
        <table className="rc-table rc-grades-table">
          <thead><tr><th>Aluno</th>{cols.map((a) => <th key={a.id} className={cx('is-num', a.absences && 'rc-grades-abs-h')}>{a.label}<span className="rc-grades-w">{a.absences ? 'no período' : `peso ${a.weight || 1}`}</span></th>)}<th className="is-num">Média</th></tr></thead>
          <tbody>{students.map((s, r) => {
            const m = avg(s);
            return (
              <tr key={s.id}>
                <th scope="row"><span className="rc-grades-st"><Avatar name={s.name} size={28} /><span>{s.name}</span></span></th>
                {cols.map((a, c) => { const k = key(s.id, a.id); return (
                  <td key={a.id} className={cx('rc-grades-cell', a.absences && 'is-abs')}>
                    <input data-cell={`${r}-${c}`} inputMode={a.absences ? 'numeric' : 'decimal'} value={vals[k] ?? ''} aria-label={`${a.label} de ${s.name}, de 0 a ${a.absences ? maxAbsences : max}`}
                      onChange={(e) => set(s.id, a.id, e.target.value)} onKeyDown={(e) => onKey(e, r, c)} onPaste={(e) => onPaste(e, r, c)} onFocus={(e) => e.target.select()} />
                  </td>
                ); })}
                <td className={cx('is-num', 'rc-grades-avg', m != null && m < 6 && 'is-low', m != null && m >= 6 && 'is-ok')}>{m == null ? <span className="rc-sr">sem média</span> : <span className="rc-grades-avg-pill">{num(m, 1)}</span>}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <div className="rc-roster-foot">
        <p className={cx('rc-roster-status', dirty ? 'is-dirty' : 'is-saved')} aria-live="polite"><Icon name={dirty ? 'clock' : 'check'} size={16} />{dirty ? `${dirty} ${dirty === 1 ? 'alteração' : 'alterações'} sem salvar` : savedAt ? `Notas salvas às ${savedAt}` : 'Nenhuma alteração para salvar'}</p>
        <div className="rc-roster-actions">
          <Button variant="ghost" disabled={!dirty || saving} onClick={() => { setVals(base); onChange && onChange(base); }}>Descartar</Button>
          <Button variant="primary" icon="check" loading={saving} loadingLabel="Salvando" disabled={!dirty} onClick={save}>Salvar notas</Button>
        </div>
      </div>
      {leave.dialog}
    </div>
  );
}

/** Turma e turno conforme o acesso de quem usa. Quem tem poucas turmas na ficha vê botões; quem vê a escola toda escolhe por segmento, turno e turma. */
export function ClassPicker({ classes = [], value: v0 = [], scope = 'minhas', label = 'Turma e turno', onChange, max = 6 }) {
  const [val, setVal] = useState(v0);
  const [seg, setSeg] = useState('todos');
  const [shift, setShift] = useState('todos');
  const [pick, setPick] = useState('');
  const put = (next) => { setVal(next); onChange && onChange(next); };
  const name = (c) => `${c.name} · ${c.shift}`;
  const chosen = classes.filter((c) => val.includes(c.id));
  const families = chosen.reduce((a, c) => a + (c.families || 0), 0);
  const total = <p className="rc-classpick-total" aria-live="polite">{chosen.length === 0 ? 'Nenhuma turma escolhida' : `${chosen.length} ${chosen.length === 1 ? 'turma' : 'turmas'} · ${num(families, 0)} famílias recebem`}</p>;
  if (scope === 'minhas' && classes.length <= max) {
    return (
      <div className="rc-classpick">
        <span className="rc-field-label">{label}</span>
        <FilterChips label={label} value={val} onChange={put} options={classes.map((c) => ({ value: c.id, label: name(c) }))} />
        <p className="rc-classpick-hint"><Icon name="lock" size={14} />Aparecem só as turmas e os turnos da sua ficha em Equipe.</p>
        {total}
      </div>
    );
  }
  const uniq = (k) => [...new Set(classes.map((c) => c[k]).filter(Boolean))];
  const pool = classes.filter((c) => (seg === 'todos' || c.segment === seg) && (shift === 'todos' || c.shift === shift));
  const free = pool.filter((c) => !val.includes(c.id));
  const add = () => { if (pick === '__todas') put([...new Set([...val, ...pool.map((c) => c.id)])]); else if (pick) put([...val, pick]); setPick(''); };
  return (
    <div className="rc-classpick">
      <span className="rc-field-label">{label}</span>
      <div className="rc-classpick-selects">
        <Select label="Segmento" value={seg} onChange={(e) => { setSeg(e.target.value); setPick(''); }} options={[{ value: 'todos', label: 'Todos os segmentos' }, ...uniq('segment').map((x) => ({ value: x, label: x }))]} />
        <Select label="Turno" value={shift} onChange={(e) => { setShift(e.target.value); setPick(''); }} options={[{ value: 'todos', label: 'Todos os turnos' }, ...uniq('shift').map((x) => ({ value: x, label: x }))]} />
        <Select label="Turma" placeholder={free.length ? 'Escolha a turma' : 'Todas já escolhidas'} value={pick} onChange={(e) => setPick(e.target.value)} disabled={!free.length} options={[...(free.length > 1 ? [{ value: '__todas', label: `Todas as ${pool.length} turmas do filtro` }] : []), ...free.map((c) => ({ value: c.id, label: name(c) }))]} />
        <Button icon="plus" disabled={!pick} onClick={add}>Adicionar</Button>
      </div>
      {chosen.length > 0 && (
        <div className="rc-classpick-chosen">{chosen.map((c) => (<span key={c.id} className="rc-classpick-tag">{name(c)}<button type="button" aria-label={`Tirar ${name(c)}`} onClick={() => put(val.filter((x) => x !== c.id))}><Icon name="x" size={14} /></button></span>))}{chosen.length > 1 && <Button size="sm" variant="ghost" onClick={() => put([])}>Limpar</Button>}</div>
      )}
      <p className="rc-classpick-hint"><Icon name="shield" size={14} />Seu acesso alcança {classes.length} turmas. Use os filtros para chegar na turma certa.</p>
      {total}
    </div>
  );
}

/** Notas no celular: uma avaliação por vez, toque em − e + (passo de 0,5) ou digite. Fica sempre entre 0 e max. */
export function GradeList({ students = [], values: v0 = {}, max = 10, step = 0.5, assessment = 'Avaliação', onSave }) {
  const [vals, setVals] = useState(v0);
  const [dirty, setDirty] = useState(0);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const clamp = (n) => Math.min(max, Math.max(0, Math.round(n * 100) / 100));
  const fmt = (n) => (n === '' || n == null ? '' : String(n).replace('.', ','));
  const put = (id, n) => { setVals((o) => ({ ...o, [id]: n })); setDirty((d) => d + 1); setSaved(null); };
  const bump = (id, dir) => { const cur = vals[id]; put(id, clamp((cur === '' || cur == null ? (dir > 0 ? max / 2 - step : max / 2 + step) : Number(cur)) + dir * step)); };
  const type = (id, raw) => { const t = String(raw).replace(/[^0-9.,]/g, '').replace(',', '.'); if (t === '') return put(id, ''); const n = Number(t); if (Number.isNaN(n) || n > max) return; put(id, /\.$/.test(t) ? t : clamp(n)); };
  const done = students.filter((s) => vals[s.id] !== '' && vals[s.id] != null).length;
  const nums = students.map((s) => Number(vals[s.id])).filter((n, i) => vals[students[i].id] !== '' && vals[students[i].id] != null && !Number.isNaN(n));
  const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  const leave = useUnsaved(dirty > 0, { onSave: () => { setDirty(0); onSave && onSave(vals); } });
  const toast = useToast();
  const save = () => { setSaving(true); setTimeout(() => { const d = new Date(); setSaving(false); setDirty(0); setSaved(`${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`); toast.show({ tone: 'success', title: 'Notas salvas' }); onSave && onSave(vals); }, 600); };
  return (
    <div className="rc-gradelist">
      <div className="rc-gradelist-top"><ProgressBar value={done} max={students.length || 1} label={`${done} de ${students.length} notas lançadas`} tone={done === students.length ? 'success' : 'brand'} size="sm" /><span className="rc-gradelist-avg">Média da turma <strong className="rc-tnum">{avg == null ? ' ' : num(avg, 1)}</strong></span></div>
      <ul className="rc-gradelist-rows">{students.map((s, i) => { const v = vals[s.id]; const empty = v === '' || v == null; const low = !empty && Number(v) < 6; return (
        <li key={s.id} className={cx(empty && 'is-empty', low && 'is-low')}>
          <span className="rc-roster-n rc-tnum">{String(i + 1).padStart(2, '0')}</span>
          <span className="rc-gradelist-name">{s.name}{s.note && <small>{s.note}</small>}</span>
          <span className="rc-app-step"><button type="button" aria-label={`Diminuir nota de ${s.name}`} disabled={!empty && Number(v) <= 0} onClick={() => bump(s.id, -1)}>−</button><input inputMode="decimal" aria-label={`${assessment} de ${s.name}, de 0 a ${max}`} value={fmt(v)} placeholder="·" onChange={(e) => type(s.id, e.target.value)} /><button type="button" aria-label={`Aumentar nota de ${s.name}`} disabled={!empty && Number(v) >= max} onClick={() => bump(s.id, 1)}>+</button></span>
        </li>
      ); })}</ul>
      <div className="rc-roster-foot">
        <p className={cx('rc-roster-status', dirty ? 'is-dirty' : 'is-saved')} aria-live="polite"><Icon name={dirty ? 'clock' : 'check'} size={16} />{dirty ? `${dirty} ${dirty === 1 ? 'alteração' : 'alterações'} sem salvar` : saved ? `Notas salvas às ${saved}` : 'Nada para salvar'}</p>
        <div className="rc-roster-actions"><Button variant="primary" icon="check" loading={saving} loadingLabel="Salvando" disabled={!dirty} onClick={save}>Salvar notas</Button></div>
      </div>
      {leave.dialog}
    </div>
  );
}

/** Chamada: todos presentes por padrão, um toque marca falta ou atraso. Contadores animam. Rodapé fixo com Salvar chamada. */
export function AttendanceRoster({ students = [], value: v0, onChange, onSave, date = 'Hoje, 26/11', lesson = '2ª aula · Matemática', offline, savedAt }) {
  const [val, setVal] = useState(() => v0 || Object.fromEntries(students.map((s) => [s.id, 'P'])));
  const [saved, setSaved] = useState(savedAt || null);
  const [dirty, setDirty] = useState(!savedAt);
  const [saving, setSaving] = useState(false);
  const cycle = { P: 'F', F: 'A', A: 'P' };
  const [touched, setTouched] = useState(false); const toast = useToast();
  const set = (id, st) => { setDirty(true); setTouched(true); setVal((o) => { const n = { ...o, [id]: st }; onChange && onChange(n); return n; }); };
  const allPresent = () => { setDirty(true); setTouched(true); setVal(() => { const n = Object.fromEntries(students.map((s) => [s.id, 'P'])); onChange && onChange(n); return n; }); };
  const leave = useUnsaved(dirty && touched, { onSave: () => { setDirty(false); setTouched(false); onSave && onSave(val); }, children: 'A chamada desta aula tem marcações que ainda não foram salvas. Se você sair agora, elas serão perdidas.' });
  const save = () => {
    setSaving(true);
    setTimeout(() => { const d = new Date(); const t = `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`; setSaving(false); setDirty(false); setTouched(false); setSaved(t); toast.show({ tone: 'success', title: 'Chamada salva', message: offline ? 'Ficou no aparelho e sobe quando a conexão voltar.' : 'As faltas já aparecem para as famílias.' }); onSave && onSave(val); }, 600);
  };
  const counts = useMemo(() => Object.values(val).reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {}), [val]);
  const LBL = { P: 'Presente', F: 'Falta', A: 'Atraso' };
  return (
    <div className="rc-roster">
      <div className="rc-roster-head">
        <div><p className="rc-roster-title">{lesson}</p><p className="rc-muted">{date}{offline && ' · sem conexão, salvo no aparelho'}</p></div>
        <div className="rc-roster-counts" aria-live="polite">
          <span className="rc-rc rc-rc-P"><strong className="rc-tnum">{counts.P || 0}</strong> presentes</span>
          <span className="rc-rc rc-rc-F"><strong className="rc-tnum">{counts.F || 0}</strong> faltas</span>
          <span className="rc-rc rc-rc-A"><strong className="rc-tnum">{counts.A || 0}</strong> atrasos</span>
        </div>
      </div>
      <ul className="rc-roster-list">
        {students.map((s, i) => {
          const st = val[s.id] || 'P';
          return (
            <li key={s.id} className={cx('rc-roster-row', `is-${st}`)} style={{ '--i': i }}>
              <span className="rc-roster-n rc-tnum">{String(i + 1).padStart(2, '0')}</span>
              <Avatar name={s.name} src={s.photo} size={36} />
              <span className="rc-roster-name">{s.name}{s.note && <span className="rc-roster-note"><Icon name="info" size={14} />{s.note}</span>}</span>
              <div className="rc-roster-ctl" role="radiogroup" aria-label={`Presença de ${s.name}`}>
                {['P', 'F', 'A'].map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={st === k} className={cx('rc-roster-opt', `rc-ro-${k}`, st === k && 'is-on')} onClick={() => set(s.id, k)} title={LBL[k]}>
                    {k}<span className="rc-sr"> {LBL[k]}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="rc-roster-tap" onClick={() => set(s.id, cycle[st])} aria-label={`${s.name}: ${LBL[st]}. Tocar para mudar`} />
            </li>
          );
        })}
      </ul>
      <div className="rc-roster-foot">
        <p className={cx('rc-roster-status', dirty ? 'is-dirty' : 'is-saved')} aria-live="polite">
          <Icon name={dirty ? 'clock' : 'check'} size={16} />
          {dirty ? (saved ? 'Alterações não salvas' : 'Chamada ainda não salva') : offline ? `Salva no aparelho às ${saved}, sobe quando a conexão voltar` : `Chamada salva às ${saved}`}
        </p>
        <div className="rc-roster-actions">
          <Button variant="ghost" onClick={allPresent}>Todos presentes</Button>
          <Button variant="primary" icon={dirty ? 'check' : undefined} loading={saving} loadingLabel="Salvando" disabled={!dirty} onClick={save}>{dirty ? 'Salvar chamada' : 'Salva'}</Button>
        </div>
      </div>
      {leave.dialog}
    </div>
  );
}

/** Conversa por assunto: bolhas, leitura, prazo de resposta da escola e campo para escrever. */
export function MessageThread({ subject, participants, sla, messages = [], me = 'me', onSend, typing }) {
  const [txt, setTxt] = useState(''); const end = useRef(null); const [list, setList] = useState(messages);
  useEffect(() => setList(messages), [messages]);
  useEffect(() => { end.current && end.current.scrollIntoView({ block: 'nearest' }); }, [list.length]);
  const send = () => { if (!txt.trim()) return; const m = { id: Date.now(), from: me, text: txt.trim(), time: 'agora', status: 'enviada' }; setList((l) => [...l, m]); onSend && onSend(m); setTxt(''); };
  return (
    <div className="rc-thread">
      <header className="rc-thread-head">
        <div><p className="rc-thread-subject">{subject}</p><p className="rc-muted">{participants}</p></div>
        {sla && <StatusPill tone="info" icon="clock" size="sm">{sla}</StatusPill>}
      </header>
      <div className="rc-thread-msgs" role="log" aria-live="polite">
        {list.map((m, i) => {
          const mine = m.from === me;
          return (
            <div key={m.id || i} className={cx('rc-msg', mine ? 'is-mine' : 'is-theirs')}>
              {!mine && <Avatar name={m.author || 'Escola'} size={28} />}
              <div className="rc-msg-col">
                {!mine && m.author && <p className="rc-msg-author">{m.author}</p>}
                <div className="rc-msg-bubble">{m.text}{m.file && <span className="rc-msg-file"><Icon name="file-text" size={16} />{m.file}</span>}</div>
                <p className="rc-msg-meta">{m.time}{mine && m.status && <span> · {m.status === 'lida' ? 'Lida' : 'Enviada'}</span>}</p>
              </div>
            </div>
          );
        })}
        {typing && <div className="rc-msg is-theirs"><Avatar name={typing} size={28} /><div className="rc-msg-bubble rc-typing" aria-label={`${typing} está escrevendo`}><i /><i /><i /></div></div>}
        <div ref={end} />
      </div>
      <div className="rc-thread-compose">
        <IconButton icon="paperclip" label="Anexar arquivo" />
        <textarea rows={1} value={txt} placeholder="Escreva sua mensagem" aria-label="Mensagem" onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <IconButton icon="send" label="Enviar" variant="primary" onClick={send} />
      </div>
    </div>
  );
}

/** Item da central de notificações. Lida em um aparelho, lida em todos. */
export function NotificationItem({ icon = 'bell', title, text, time, unread, priority, onClick, index = 0 }) {
  const tone = priority === 'urgente' ? 'danger' : priority === 'importante' ? 'warning' : 'neutral';
  return (
    <li className={cx('rc-notif', unread && 'is-unread')} style={{ '--i': index }}>
      <button type="button" className="rc-notif-row" onClick={onClick}>
        <span className={cx('rc-notif-ico', `rc-tone-${tone}`)}><Icon name={icon} size={18} /></span>
        <span className="rc-notif-body"><span className="rc-notif-title">{title}</span>{text && <span className="rc-notif-text">{text}</span>}<span className="rc-notif-time">{time}</span></span>
        {unread && <Badge dot tone="brand" label="Não lida" />}
      </button>
    </li>
  );
}

/** Cabeçalho da ficha 360 do aluno: identidade, turma, situação e atalhos. */
export function StudentHeader({ name, photo, group, enrollment, guardians = [], tags = [], actions }) {
  return (
    <header className="rc-card rc-student">
      <Avatar name={name} src={photo} size={72} />
      <div className="rc-student-main">
        <h2 className="rc-student-name">{name}</h2>
        <p className="rc-student-meta"><span>{group}</span><span>Matrícula <code className="rc-code-inline">{enrollment}</code></span>{guardians.length > 0 && <span>Responsáveis: {guardians.join(', ')}</span>}</p>
        {tags.length > 0 && <div className="rc-student-tags">{tags.map((t) => <StatusPill key={t.label} tone={t.tone} icon={t.icon} size="sm">{t.label}</StatusPill>)}</div>}
      </div>
      {actions && <div className="rc-student-actions">{actions}</div>}
    </header>
  );
}

const DL = { refeicao: { icon: 'utensils', label: 'Alimentação', opts: ['Comeu tudo', 'Comeu bem', 'Comeu pouco', 'Não comeu'] }, sono: { icon: 'bed', label: 'Sono', opts: ['Dormiu', 'Descansou', 'Não dormiu'] }, higiene: { icon: 'baby', label: 'Higiene', opts: ['Xixi', 'Cocô', 'Troca de fralda'] }, humor: { icon: 'heart', label: 'Humor', opts: ['Tranquilo', 'Agitado', 'Choroso'] } };
/** Diário da educação infantil: registro rápido por criança, aplicável à turma toda. */
export function DailyLog({ child = { name: 'Maria Clara Pinheiro' }, entries = {}, onChange, photos = 0 }) {
  const [v, setV] = useState(entries);
  const set = (k, o) => setV((x) => { const n = { ...x, [k]: x[k] === o ? undefined : o }; onChange && onChange(n); return n; });
  return (
    <div className="rc-card rc-daily">
      <header className="rc-daily-head"><Avatar name={child.name} src={child.photo} size={40} /><div><p className="rc-title-sm">{child.name}</p><p className="rc-muted">{child.group || 'Infantil 3 · Manhã'}</p></div>
        <Button size="sm" variant="ghost" icon="camera">{photos ? `${photos} fotos` : 'Foto'}</Button></header>
      {Object.entries(DL).map(([k, d]) => (
        <div key={k} className="rc-daily-row">
          <p className="rc-daily-label"><Icon name={d.icon} size={16} />{d.label}</p>
          <div className="rc-chips">{d.opts.map((o) => <button key={o} type="button" className={cx('rc-chip', v[k] === o && 'is-on')} aria-pressed={v[k] === o} onClick={() => set(k, o)}><span className="rc-chip-check" aria-hidden="true"><Icon name="check" size={14} strokeWidth={2.25} /></span><span>{o}</span></button>)}</div>
        </div>
      ))}
    </div>
  );
}

/** Liga e desliga um módulo para a escola, com dependências e impacto. */
export function ModuleCard({ icon, name, description, enabled: enabled0, onToggle, requires = [], segments = [], plan, locked, color = 'azul' }) {
  const [enabled, setEnabled] = useState(!!enabled0);
  useEffect(() => { setEnabled(!!enabled0); }, [enabled0]);
  return (
    <div className={cx('rc-card', 'rc-module', `rc-c-${color}`, enabled && 'is-on', locked && 'is-locked')}>
      <div className="rc-module-head">
        <span className="rc-module-ico"><Icon name={icon} size={20} /></span>
        <div className="rc-module-titles"><p className="rc-title-sm">{name}</p>{plan && <span className="rc-module-plan">{plan}</span>}</div>
        {locked ? <StatusPill tone="neutral" icon="lock" size="sm">Sempre ligado</StatusPill> : <Switch checked={enabled} onChange={(on, e) => { setEnabled(on); onToggle && onToggle(on, e); }} label={<span className="rc-sr">{name}</span>} />}
      </div>
      <p className="rc-module-desc">{description}</p>
      {(requires.length > 0 || segments.length > 0) && (
        <div className="rc-module-meta">
          {requires.length > 0 && <span><Icon name="modules" size={14} />Precisa de {requires.join(', ')}</span>}
          {segments.length > 0 && <span><Icon name="school" size={14} />{segments.join(' · ')}</span>}
        </div>
      )}
    </div>
  );
}

/** Prévia do tema da escola: a cor escolhida, o que o sistema ajustou e por quê. */
export function BrandPreview({ name = 'Colégio Recreio', seed = '#1E3A8A', logo, mode = 'claro' }) {
  const pal = useMemo(() => schoolPalette(seed, mode), [seed, mode]);
  const v = pal.vars;
  return (
    <div className="rc-brandprev" data-theme={mode} style={v}>
      <div className="rc-brandprev-app">
        <div className="rc-brandprev-top"><SchoolMark name={name} src={logo} size={28} /><span className="rc-brandprev-name">{name}</span><Icon name="bell" size={18} /></div>
        <p className="rc-brandprev-hello">Bom dia, Mariana</p>
        <div className="rc-brandprev-card"><p className="rc-overline">Pendência</p><p className="rc-title-sm">Mensalidade de dezembro</p><p className="rc-muted">Vence sexta, 10/12</p><span className="rc-btn rc-btn-primary rc-btn-sm" aria-hidden="true">Pagar com Pix</span></div>
        <div className="rc-brandprev-tabs"><span className="is-on"><Icon name="home" size={18} />Hoje</span><span><Icon name="calendar" size={18} />Agenda</span><span><Icon name="wallet" size={18} />Financeiro</span></div>
      </div>
      <div className="rc-brandprev-report">
        <div className="rc-brandprev-swatches">
          {['--brand', '--brand-strong', '--brand-soft', '--brand-ink'].map((k) => <span key={k} className="rc-brandprev-sw"><i style={{ background: v[k] }} /><code>{k.slice(2)}</code><span className="rc-muted">{v[k]}</span></span>)}
        </div>
        <ul className="rc-brandprev-checks">{pal.checks.map((c) => <li key={c.pair}><Icon name={c.ratio >= 4.5 ? 'check-circle' : 'alert'} size={16} className={c.ratio >= 4.5 ? 'is-ok' : 'is-bad'} /><span>{c.pair}</span><strong className="rc-tnum">{c.ratio.toFixed(1)}:1</strong></li>)}</ul>
        {pal.notes.filter((n) => n.token === 'brand' && mode === 'claro').map((n) => <p key={n.token} className="rc-brandprev-note"><Icon name="info" size={16} />Cor original {n.from} {n.reason}.</p>)}
      </div>
    </div>
  );
}

const BRAND_PRESETS = [
  { id: 'recreio', label: 'Azul Recreio', primary: '#0067CC', secondary: '#001949', accent: '#FECF04' },
  { id: 'verde', label: 'Verde colegial', primary: '#0B7A4B', secondary: '#0A3D2E', accent: '#F2B705' },
  { id: 'vinho', label: 'Vinho tradicional', primary: '#8E1B3A', secondary: '#3B0A1A', accent: '#D9A441' },
  { id: 'laranja', label: 'Laranja infantil', primary: '#D9480F', secondary: '#4A1D0B', accent: '#12B5CB' },
  { id: 'roxo', label: 'Roxo moderno', primary: '#6D3FD1', secondary: '#24124F', accent: '#FF8A3D' },
  { id: 'grafite', label: 'Grafite sóbrio', primary: '#33415C', secondary: '#111827', accent: '#3DDC97' }];
const BRAND_PLACES = [['modules', 'Sistema web', 'Menu, botões, links e gráficos'], ['phone', 'App das famílias', 'Ícone, nome e cores do app'], ['lock', 'Tela de login', 'Logo, nome e frase da escola'], ['chart', 'Boletim e histórico', 'Cabeçalho, rodapé e assinatura'], ['edit', 'Contratos', 'Cabeçalho e dados legais'], ['receipt', 'Recibos e informe de IR', 'Razão social e CNPJ'], ['file-text', 'Declarações', 'Cabeçalho e marca d\'água'], ['mail', 'E-mails e avisos', 'Topo com logo e cor da escola']];
const onlyDigits = (v) => String(v || '').replace(/\D/g, '');
const fmtCnpj = (v) => { const d = onlyDigits(v).slice(0, 14); return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2'); };
/** Manual da marca da escola: identidade, logos, cores, tipografia, dados dos documentos e prévias. Salvar aplica em todo o sistema. */
export function BrandEditor({ defaults = {}, onSave }) {
  const base = useMemo(() => ({ name: 'Colégio Recreio', short: 'Recreio', slogan: '', primary: '#0067CC', secondary: '#001949', accent: '#FECF04', navStyle: 'secundaria', font: 'padrao', radius: 'suaves', logo: '', logoDark: '', symbol: '', legalName: '', cnpj: '', address: '', phone: '', site: '', act: '', signer: '', signerRole: '', headerAlign: 'esquerda', watermark: true, footer: true, qr: true, ...defaults }), [defaults]);
  const [saved, setSaved] = useState(() => ({ ...base, ...(loadBrand() || {}) }));
  const [b, setB] = useState(saved);
  const [dlg, setDlg] = useState(null);
  const [okAt, setOkAt] = useState(null);
  const [fileErr, setFileErr] = useState('');
  const set = (k, v) => { setB((o) => ({ ...o, [k]: v })); setOkAt(null); };
  const dirty = useMemo(() => Object.keys(b).filter((k) => b[k] !== saved[k]).length, [b, saved]);
  const leave = useUnsaved(dirty > 0, { children: 'A marca tem alterações que ainda não foram salvas. Se você sair agora, o sistema continua com a marca anterior.' });
  const errs = { name: !b.name.trim() ? 'Informe o nome da escola' : '', primary: !isHex(b.primary) ? 'Use o formato #RRGGBB' : '', secondary: !isHex(b.secondary) ? 'Use o formato #RRGGBB' : '', accent: !isHex(b.accent) ? 'Use o formato #RRGGBB' : '', cnpj: b.cnpj && onlyDigits(b.cnpj).length !== 14 ? 'O CNPJ tem 14 dígitos' : '' };
  const invalid = Object.values(errs).some(Boolean);
  const safe = { ...b, primary: isHex(b.primary) ? b.primary : saved.primary, secondary: isHex(b.secondary) ? b.secondary : saved.secondary, accent: isHex(b.accent) ? b.accent : saved.accent };
  const bv = useMemo(() => brandVars(safe, 'claro'), [safe.primary, safe.secondary, safe.accent, safe.navStyle, safe.font, safe.radius]);
  const v = bv.vars;
  const pickFile = (k) => (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(f.type)) { setFileErr('Envie PNG, JPG, SVG ou WebP.'); return; } if (f.size > 400 * 1024) { setFileErr('A imagem passa de 400 KB. Envie uma versão menor.'); return; } setFileErr(''); const r = new FileReader(); r.onload = () => set(k, String(r.result)); r.readAsDataURL(f); };
  const toast = useToast();
  const apply = () => { toast.show({ tone: 'success', title: 'Marca salva', message: 'Já vale no sistema, no app, no login e nos documentos.' }); saveBrand(b); setSaved(b); setDlg(null); const d = new Date(); setOkAt(`${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`); onSave && onSave(b); };
  const restore = () => { saveBrand(null); setSaved(base); setB(base); setDlg(null); setOkAt(null); };
  const preset = BRAND_PRESETS.find((p) => p.primary === b.primary && p.secondary === b.secondary && p.accent === b.accent);
  const Color = ({ k, label, hint }) => (
    <div className="rc-brand-color">
      <label className="rc-brand-swatch" style={{ background: isHex(b[k]) ? b[k] : 'var(--surface-2)' }}><span className="rc-sr">Escolher {label}</span><input type="color" value={isHex(b[k]) ? b[k] : '#000000'} onChange={(e) => set(k, e.target.value.toUpperCase())} /></label>
      <div className="rc-brand-colortext"><TextField label={label} hint={errs[k] ? undefined : hint} error={errs[k] || undefined} value={b[k]} onChange={(e) => set(k, e.target.value.trim().toUpperCase().slice(0, 7))} /></div>
    </div>
  );
  const LogoTile = ({ k, label, hint, dark }) => (
    <div className="rc-brand-logo">
      <span className={cx('rc-brand-logobox', dark && 'is-dark')} style={dark ? { background: v['--nav'] || 'var(--nav)' } : undefined}>{b[k] ? <img src={b[k]} alt={label} /> : <SchoolMark name={b.name || 'Escola'} size={48} />}</span>
      <span className="rc-brand-logotext"><strong>{label}</strong><small>{hint}</small></span>
      <span className="rc-brand-logoacts"><label className="rc-btn rc-btn-secondary rc-btn-sm"><Icon name="upload" size={16} /><span className="rc-btn-label">{b[k] ? 'Trocar' : 'Enviar'}</span><input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="rc-sr" onChange={pickFile(k)} /></label>{b[k] && <Button size="sm" variant="ghost" onClick={() => set(k, '')}>Remover</Button>}</span>
    </div>
  );
  const Sec = ({ n, title, sub, children }) => (<section className="rc-brand-sec"><header><span className="rc-brand-n">{n}</span><div><h3 className="rc-title-sm">{title}</h3>{sub && <p className="rc-muted">{sub}</p>}</div></header>{children}</section>);
  const mark = (size, dark) => (<SchoolMark name={b.name || 'Escola'} src={dark ? (b.symbol || b.logoDark) : (b.logo || b.symbol)} size={size} />);
  return (
    <div className="rc-brand">
      {okAt && <Alert tone="success" title={`Marca salva e aplicada às ${okAt}`}>Menu, botões, app, login e os documentos emitidos a partir de agora já usam a nova marca. Documentos já assinados não mudam.</Alert>}
      <section className="rc-brand-preview" aria-label="Prévia da marca">
        <div className="rc-brand-prevhead"><div><h3 className="rc-title-sm">Prévia ao vivo</h3><p className="rc-muted">Muda enquanto você edita. Só vale para todos depois de salvar.</p></div>{dirty > 0 && !invalid && <StatusPill tone="warning" size="sm" icon="edit">Prévia com alterações não salvas</StatusPill>}</div>
        <div className="rc-brand-stage" style={v}>
          <figure><figcaption>Sistema web</figcaption><div className="rc-brand-web">
                <div className="rc-brand-webnav"><div className="rc-brand-webschool">{mark(30, true)}<span>{b.short || b.name || 'Escola'}</span></div>{[['home', 'Painel'], ['edit', 'Notas'], ['calendar', 'Agenda'], ['wallet', 'Financeiro']].map(([ic, t], i) => <span key={t} className={cx('rc-brand-webitem', i === 1 && 'is-on')}><Icon name={ic} size={16} />{t}</span>)}</div>
                <div className="rc-brand-webmain"><p className="rc-brand-webtitle">Notas</p><div className="rc-brand-webcard"><p className="rc-overline">Fechamento</p><p className="rc-title-sm">4º bimestre fecha em 04/12</p><div className="rc-brand-webrow"><span className="rc-btn rc-btn-primary rc-btn-sm" aria-hidden="true">Fechar bimestre</span><span className="rc-btn rc-btn-secondary rc-btn-sm" aria-hidden="true">Exportar</span><span className="rc-brand-tag">Novo</span></div></div><div className="rc-brand-webcard"><a href="#" onClick={(e) => e.preventDefault()}>Ver como a família vê</a><div className="rc-brand-bar"><i style={{ width: '72%' }} /></div><small className="rc-muted">22 de 31 famílias deram visto</small></div></div>
              </div></figure>
          <figure><figcaption>App das famílias</figcaption><div className="rc-brand-phone"><div className="rc-brandprev-app"><div className="rc-brandprev-top">{mark(28)}<span className="rc-brandprev-name">{b.short || b.name}</span><Icon name="bell" size={18} /></div><p className="rc-brandprev-hello">Bom dia, Fernanda</p><div className="rc-brandprev-card"><p className="rc-overline">Pendência</p><p className="rc-title-sm">Mensalidade de dezembro</p><p className="rc-muted">Vence quinta, 10/12</p><span className="rc-btn rc-btn-primary rc-btn-sm" aria-hidden="true">Pagar com Pix</span></div><div className="rc-brandprev-tabs"><span className="is-on"><Icon name="home" size={18} />Hoje</span><span><Icon name="calendar" size={18} />Agenda</span><span><Icon name="wallet" size={18} />Financeiro</span></div></div><div className="rc-brand-appicon"><span style={{ background: v['--brand'] }}>{mark(40, true)}</span><small>{b.short || b.name}</small></div></div></figure>
          <figure><figcaption>Documentos</figcaption><div className="rc-brand-doc">
                {b.watermark && <span className="rc-brand-wm" aria-hidden="true">{mark(150)}</span>}
                <div className={cx('rc-brand-dochead', b.headerAlign === 'centro' && 'is-center')}>{mark(40, true)}<div><strong>{b.name || 'Nome da escola'}</strong><small>{[b.legalName, b.cnpj && `CNPJ ${b.cnpj}`].filter(Boolean).join(' · ') || 'Razão social e CNPJ'}</small></div></div>
                <p className="rc-brand-doctitle">Boletim escolar · 4º bimestre de 2026</p>
                <p className="rc-brand-docline">Ana Beatriz Lima · 9º ano A · Manhã · matrícula 2018-0214</p>
                <div className="rc-brand-doctable">{[['Matemática', '8,8'], ['Língua Portuguesa', '9,0'], ['Ciências', '7,5']].map(([d, n]) => <div key={d}><span>{d}</span><strong>{n}</strong></div>)}</div>
                <div className="rc-brand-docsign"><div><i />{b.signer || 'Quem assina'}<small>{b.signerRole || 'Cargo'}</small></div>{b.qr && <span className="rc-brand-qr" aria-label="QR code de autenticidade"><Icon name="qr" size={34} /></span>}</div>
                {b.footer && <p className="rc-brand-docfoot">{[b.address, b.phone, b.site].filter(Boolean).join(' · ') || 'Endereço, telefone e site'}{b.act && <><br />{b.act}</>}</p>}
              </div></figure>
          <figure><figcaption>Login e e-mail</figcaption><div className="rc-brand-login">
                <div className="rc-brand-logincard">{mark(48)}<strong>{b.name || 'Nome da escola'}</strong>{b.slogan && <small>{b.slogan}</small>}<span className="rc-brand-input">CPF ou e-mail</span><span className="rc-btn rc-btn-primary rc-btn-sm rc-btn-full" aria-hidden="true">Entrar</span></div>
                <div className="rc-brand-mail"><div className="rc-brand-mailtop">{mark(26, true)}<span>{b.name || 'Nome da escola'}</span></div><div className="rc-brand-mailbody"><strong>Boletim do 4º bimestre publicado</strong><p>Olá, Fernanda. O boletim da Ana Beatriz já está disponível.</p><span className="rc-btn rc-btn-primary rc-btn-sm" aria-hidden="true">Abrir boletim</span>{b.slogan && <small>{b.slogan}</small>}</div></div>
              </div></figure>
        </div>
      </section>
      <div className="rc-brand-grid">
        <div className="rc-brand-form">
          {Sec({ n: 1, title: 'Identidade', sub: 'Nome e logos como estão no manual da marca da escola.', children: (<>
            <div className="rc-brand-2"><TextField label="Nome da escola" required error={errs.name || undefined} value={b.name} onChange={(e) => set('name', e.target.value)} /><TextField label="Nome curto" hint="Aparece no app e no menu recolhido" value={b.short} maxLength={18} onChange={(e) => set('short', e.target.value)} /></div>
            <TextField label="Frase da escola" hint="Aparece na tela de login e no rodapé dos e-mails" value={b.slogan} maxLength={80} onChange={(e) => set('slogan', e.target.value)} />
            <div className="rc-brand-logos">{LogoTile({ k: 'logo', label: 'Logo principal', hint: 'Fundo claro · login e documentos' })}{LogoTile({ k: 'logoDark', label: 'Logo para fundo escuro', hint: 'Menu lateral e cabeçalhos', dark: true })}{LogoTile({ k: 'symbol', label: 'Símbolo', hint: 'Ícone do app e aba do navegador', dark: true })}</div>
            <p className={cx('rc-brand-filehint', fileErr && 'is-err')} role={fileErr ? 'alert' : undefined}>{fileErr || 'PNG, JPG, SVG ou WebP, até 400 KB. Sem logo, o sistema usa as iniciais da escola.'}</p>
          </>) })}
          {Sec({ n: 3, title: 'Tipografia e formas', children: (<div className="rc-brand-stack">
            <div><span className="rc-field-label">Fonte</span><SegmentedControl label="Fonte" value={b.font} onChange={(x) => set('font', x)} options={[{ value: 'padrao', label: 'Padrão' }, { value: 'arredondada', label: 'Arredondada' }, { value: 'serifada', label: 'Com serifa' }]} /></div>
            <div><span className="rc-field-label">Cantos</span><SegmentedControl label="Cantos" value={b.radius} onChange={(x) => set('radius', x)} options={[{ value: 'retos', label: 'Retos' }, { value: 'suaves', label: 'Suaves' }, { value: 'arredondados', label: 'Arredondados' }]} /></div>
          </div>) })}
          {Sec({ n: 5, title: 'Onde a marca aparece', sub: 'Ao salvar, tudo abaixo muda de uma vez.', children: (<ul className="rc-brand-places">{BRAND_PLACES.map(([ic, t, d]) => <li key={t}><span className="rc-brand-placeico"><Icon name={ic} size={18} /></span><span><strong>{t}</strong><small>{d}</small></span><Icon name="check-circle" size={18} className="rc-brand-placeok" /></li>)}</ul>) })}
        </div>
        <div className="rc-brand-form">
          {Sec({ n: 2, title: 'Cores', sub: 'O sistema ajusta os tons sozinho para o texto continuar legível.', children: (<>
            <div><span className="rc-field-label">Paletas prontas</span><div className="rc-brand-presets">{BRAND_PRESETS.map((p) => (<button key={p.id} type="button" className={cx('rc-brand-preset', preset && preset.id === p.id && 'is-on')} aria-pressed={!!(preset && preset.id === p.id)} onClick={() => { setB((o) => ({ ...o, primary: p.primary, secondary: p.secondary, accent: p.accent })); setOkAt(null); }}><span className="rc-brand-dots"><i style={{ background: p.primary }} /><i style={{ background: p.secondary }} /><i style={{ background: p.accent }} /></span>{p.label}</button>))}</div></div>
            <div className="rc-brand-3">{Color({ k: 'primary', label: 'Primária', hint: 'Botões, links e destaques' })}{Color({ k: 'secondary', label: 'Secundária', hint: 'Menu e cabeçalho de documento' })}{Color({ k: 'accent', label: 'Destaque', hint: 'Selos, avisos e item ativo' })}</div>
            <div><span className="rc-field-label">Cor do menu lateral</span><SegmentedControl label="Cor do menu lateral" value={b.navStyle} onChange={(x) => set('navStyle', x)} options={[{ value: 'secundaria', label: 'Secundária' }, { value: 'primaria', label: 'Primária' }]} /></div>
            <div className="rc-brand-report">
              <div className="rc-brandprev-swatches">{['--brand', '--brand-strong', '--brand-soft', '--brand-ink', '--nav', '--accent'].map((k) => <span key={k} className="rc-brandprev-sw"><i style={{ background: v[k] }} /><code>{k.slice(2)}</code><span className="rc-muted">{v[k]}</span></span>)}</div>
              <ul className="rc-brandprev-checks">{bv.checks.map((c) => <li key={c.pair}><Icon name={c.ratio >= 4.5 ? 'check-circle' : 'alert'} size={16} className={c.ratio >= 4.5 ? 'is-ok' : 'is-bad'} /><span>{{ 'on-brand / brand': 'Texto sobre botão', 'brand-ink / surface-0': 'Link sobre o fundo', 'brand-ink / brand-soft': 'Texto sobre selo claro', 'on-nav-2 / nav-2': 'Texto do menu' }[c.pair] || c.pair}</span><strong className="rc-tnum">{c.ratio.toFixed(1)}:1</strong></li>)}</ul>
              {bv.notes.filter((n) => n.token === 'brand').map((n) => <p key={n.token} className="rc-brandprev-note"><Icon name="info" size={16} />A cor {n.from} foi {n.reason}. O tom usado é {n.to}.</p>)}
            </div>
          </>) })}
          {Sec({ n: 4, title: 'Dados para documentos', sub: 'Vão no cabeçalho e no rodapé de boletins, contratos, recibos e declarações.', children: (<>
            <div className="rc-brand-2"><TextField label="Razão social" value={b.legalName} onChange={(e) => set('legalName', e.target.value)} /><TextField label="CNPJ" error={errs.cnpj || undefined} value={b.cnpj} inputMode="numeric" onChange={(e) => set('cnpj', fmtCnpj(e.target.value))} /></div>
            <TextField label="Endereço" value={b.address} onChange={(e) => set('address', e.target.value)} />
            <div className="rc-brand-2"><TextField label="Telefone" value={b.phone} onChange={(e) => set('phone', e.target.value)} /><TextField label="Site ou e-mail" value={b.site} onChange={(e) => set('site', e.target.value)} /></div>
            <TextField label="Ato de autorização" hint="Ex.: parecer do Conselho de Educação" value={b.act} onChange={(e) => set('act', e.target.value)} />
            <div className="rc-brand-2"><TextField label="Quem assina os documentos" value={b.signer} onChange={(e) => set('signer', e.target.value)} /><TextField label="Cargo" value={b.signerRole} onChange={(e) => set('signerRole', e.target.value)} /></div>
            <div><span className="rc-field-label">Cabeçalho dos documentos</span><SegmentedControl label="Cabeçalho dos documentos" value={b.headerAlign} onChange={(x) => set('headerAlign', x)} options={[{ value: 'esquerda', label: 'Logo à esquerda' }, { value: 'centro', label: 'Centralizado' }]} /></div>
            <div className="rc-brand-switches"><Switch checked={b.watermark} onChange={(x) => set('watermark', !!(x && x.target ? x.target.checked : x))} label="Marca d'água com o símbolo" /><Switch checked={b.footer} onChange={(x) => set('footer', !!(x && x.target ? x.target.checked : x))} label="Rodapé com endereço e contato" /><Switch checked={b.qr} onChange={(x) => set('qr', !!(x && x.target ? x.target.checked : x))} label="QR code de autenticidade" /></div>
          </>) })}
        </div>
      </div>
      <div className={cx('rc-perm-save', 'rc-brand-save', dirty > 0 && 'is-dirty')}>
        <span>{invalid ? 'Corrija os campos marcados para salvar' : dirty > 0 ? `${dirty} ${dirty === 1 ? 'alteração' : 'alterações'} sem salvar` : 'Tudo salvo'}</span>
        <Button variant="ghost" onClick={() => setDlg('restaurar')}>Restaurar padrão</Button>
        <Button variant="ghost" disabled={!dirty} onClick={() => { setB(saved); setFileErr(''); }}>Desfazer</Button>
        <Button variant="primary" icon="check" disabled={!dirty || invalid} onClick={() => setDlg('salvar')}>Salvar marca</Button>
      </div>
      <Dialog open={dlg === 'salvar'} onClose={() => setDlg(null)} title="Aplicar a marca em todo o sistema?" description="A mudança vale para toda a equipe, para as famílias e para os documentos emitidos a partir de agora." icon="palette" tone="brand"
        footer={<><Button variant="ghost" onClick={() => setDlg(null)}>Revisar</Button><Button variant="primary" onClick={apply}>Salvar e aplicar</Button></>}>
        <ul className="rc-brand-places is-compact">{BRAND_PLACES.map(([ic, t]) => <li key={t}><span className="rc-brand-placeico"><Icon name={ic} size={16} /></span><span><strong>{t}</strong></span></li>)}</ul>
        <p className="rc-muted" style={{ margin: '12px 0 0', fontSize: 14 }}>Documentos já assinados continuam com a marca da data da assinatura.</p>
      </Dialog>
      <Dialog open={dlg === 'restaurar'} onClose={() => setDlg(null)} title="Voltar para a marca padrão?" description="As cores, os logos e os dados que você salvou são apagados. Não dá para desfazer." icon="alert" tone="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDlg(null)}>Cancelar</Button><Button variant="danger" onClick={restore}>Restaurar padrão</Button></>} />
      {leave.dialog}
    </div>
  );
}

const PREF_KEYS = ['theme', 'textScale', 'spacing', 'font', 'reading', 'motion', 'focus'];
/** Painel de acessibilidade e leitura: a prévia muda na hora, e Salvar preferências grava na conta. Avisa ao sair sem salvar. */
export function PreferencesPanel({ compact, onSave }) {
  const { prefs, setPrefs } = usePreferences();
  const [base, setBase] = useState(prefs);
  const [extra, setExtra] = useState({ libras: false, ouvir: true, traduzir: false });
  const [baseX, setBaseX] = useState(extra);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const dirty = PREF_KEYS.filter((k) => (prefs[k] ?? '') !== (base[k] ?? '')).length + Object.keys(extra).filter((k) => extra[k] !== baseX[k]).length;
  const toast = useToast();
  const commit = () => { const d = new Date(); toast.show({ tone: 'success', title: 'Preferências salvas', message: 'Valem em todos os seus aparelhos.' }); setBase(prefs); setBaseX(extra); setSavedAt(`${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`); onSave && onSave({ ...prefs, ...extra }); };
  const save = () => { setSaving(true); setTimeout(() => { setSaving(false); commit(); }, 600); };
  const discard = () => { setPrefs(Object.fromEntries(PREF_KEYS.map((k) => [k, base[k]]))); setExtra(baseX); };
  const leave = useUnsaved(dirty > 0, { onSave: commit, children: 'As preferências que você mudou ainda não foram salvas. Se você sair agora, elas voltam ao que era antes no próximo acesso.' });
  return (
    <div className={cx('rc-prefs', compact && 'is-compact')}>
      <section className="rc-prefs-sec">
        <h3 className="rc-prefs-h"><Icon name="contrast" size={18} />Aparência</h3>
        <SegmentedControl label="Tema" full value={prefs.theme || 'claro'} onChange={(t) => setPrefs({ theme: t })}
          options={[{ value: 'claro', label: 'Claro', icon: 'sun' }, { value: 'escuro', label: 'Escuro', icon: 'moon' }, { value: 'alto-contraste', label: 'Alto contraste', icon: 'contrast' }]} />
      </section>
      <section className="rc-prefs-sec">
        <h3 className="rc-prefs-h"><Icon name="text-size" size={18} />Leitura</h3>
        <Slider label="Tamanho do texto" min={100} max={200} step={10} value={prefs.textScale} onChange={(v) => setPrefs({ textScale: v })} format={(v) => `${v}%`} marks={[100, 150, 200]} />
        <RadioGroup legend="Espaçamento do texto" value={prefs.spacing} onChange={(v) => setPrefs({ spacing: v })} variant="list"
          options={[{ value: 'normal', label: 'Normal' }, { value: 'amplo', label: 'Amplo', description: 'Mais espaço entre letras, palavras e linhas. Ajuda na dislexia e na baixa visão.' }]} />
        <RadioGroup legend="Fonte" value={prefs.font} onChange={(v) => setPrefs({ font: v })}
          options={[{ value: 'padrao', label: 'Padrão' }, { value: 'legivel', label: 'Alta legibilidade', description: 'Letras mais fáceis de diferenciar, como I, l e 1.' }]} />
        <Switch label="Leitura simples" description="Mostra primeiro o resumo de cada comunicado, com frases curtas." checked={prefs.reading === 'simples'} onChange={(on) => setPrefs({ reading: on ? 'simples' : 'normal' })} />
      </section>
      <section className="rc-prefs-sec">
        <h3 className="rc-prefs-h"><Icon name="target" size={18} />Atenção e movimento</h3>
        <Switch label="Reduzir movimento" description="Sem animações nem nada que se mexa sozinho." checked={prefs.motion === 'reduzido'} onChange={(on) => setPrefs({ motion: on ? 'reduzido' : 'sistema' })} />
        <Switch label="Modo foco" description="Uma coisa por vez: esconde painéis e atalhos secundários." checked={!!prefs.focus} onChange={(on) => setPrefs({ focus: on })} />
      </section>
      <section className="rc-prefs-sec">
        <h3 className="rc-prefs-h"><Icon name="hand" size={18} />Outras formas de acessar</h3>
        <Switch label="Mostrar tradutor de Libras" description="Ativa o VLibras em todas as telas." checked={extra.libras} onChange={(on) => setExtra((x) => ({ ...x, libras: on }))} />
        <Switch label="Botão de ouvir em comunicados e tarefas" checked={extra.ouvir} onChange={(on) => setExtra((x) => ({ ...x, ouvir: on }))} />
        <Switch label="Traduzir comunicados automaticamente" description="Para famílias que leem melhor em outra língua." checked={extra.traduzir} onChange={(on) => setExtra((x) => ({ ...x, traduzir: on }))} />
      </section>
      <div className={cx('rc-savebar', dirty > 0 && 'is-dirty')} role="group" aria-label="Salvar preferências">
        <p className="rc-savebar-status" aria-live="polite"><Icon name={dirty > 0 ? 'clock' : 'sync'} size={16} /><span>{dirty > 0 ? `${dirty} ${dirty === 1 ? 'alteração' : 'alterações'} sem salvar. A prévia já mostra como fica.` : savedAt ? `Salvo na sua conta às ${savedAt}. Vale em todos os seus aparelhos.` : 'Salvo na sua conta e válido em todos os seus aparelhos.'}</span></p>
        <Button variant="ghost" disabled={!dirty || saving} onClick={discard}>Descartar</Button>
        <Button variant="primary" icon="check" disabled={!dirty} loading={saving} loadingLabel="Salvando" onClick={save}>Salvar preferências</Button>
      </div>
      {leave.dialog}
    </div>
  );
}

/** Tela de entrada dividida: formulário de um lado, vitrine animada do produto do outro. */
/** Entrada: formulário da escola de um lado, vitrine animada do Recreio Sistema Educacional do outro. */
export function LoginLayout({ school: school0 = { name: 'Colégio Recreio' }, children, slides, product = 'Recreio Sistema Educacional', showcase = true }) {
  const saved = useBrand();
  const school = saved && (saved.name || saved.logo) ? { ...school0, name: saved.name || school0.name, logo: saved.logo || school0.logo } : school0;
  const reduced = useReducedMotion();
  const items = slides || [
    { kicker: 'Família', title: 'O dia do seu filho numa tela só', text: 'Aula, tarefa, cardápio, recado e foto, na ordem em que acontecem.', art: 'today' },
    { kicker: 'Financeiro', title: 'Mensalidade paga em 10 segundos', text: 'Pix copia e cola, boleto com segunda via e recibo para o Imposto de Renda no fim do ano.', art: 'pix' },
    { kicker: 'Sala de aula', title: 'Chamada feita antes do sinal tocar', text: 'Todos presentes por padrão. Um toque marca falta, mesmo sem internet.', art: 'roster' },
    { kicker: 'Portaria', title: 'Só sai com quem a família autorizou', text: 'Foto, documento e QR de retirada conferidos na portaria, com aviso no celular dos pais.', art: 'gate' },
    { kicker: 'Gestão', title: 'A escola inteira em números, ao vivo', text: 'Adimplência, frequência e matrículas do dia, por unidade e por turma.', art: 'kpi' },
  ];
  const [i, setI] = useState(0);
  useEffect(() => { if (reduced) return; const t = setInterval(() => setI((x) => (x + 1) % items.length), 6000); return () => clearInterval(t); }, [reduced, items.length]);
  return (
    <div className={cx('rc-login', !showcase && 'no-showcase')}>
      <div className="rc-login-form">
        <div className="rc-login-brand"><SchoolMark name={school.name} src={school.logo} size={44} /><span className="rc-login-school">{school.name}{school.unit && <small>{school.unit}</small>}</span></div>
        <div className="rc-login-body">{children}</div>
        <MadeBy product={product} className="rc-login-madeby" />
      </div>
      {showcase && (
        <aside className="rc-login-show" aria-label="Conheça o Recreio Sistema Educacional" data-secondary>
          <div className="rc-login-shapes" aria-hidden="true">{['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((k) => <span key={k} className={`is-${k}`} />)}</div>
          <Logo variant="full" tone="negativo" size={84} className="rc-login-logo" />
          <div className="rc-login-stage">
            {items.map((sl, k) => (
              <div key={sl.title} className={cx('rc-login-slide', k === i && 'is-on')} aria-hidden={k !== i}>
                <ShowArt kind={sl.art} />
                <p className="rc-login-kicker">{sl.kicker}</p>
                <h2 className="rc-login-title">{sl.title}</h2>
                <p className="rc-login-text">{sl.text}</p>
              </div>
            ))}
          </div>
          <div className="rc-login-dots" role="tablist" aria-label="Destaques">
            {items.map((sl, k) => <button key={sl.title} type="button" role="tab" aria-selected={k === i} aria-label={sl.title} className={cx('rc-login-dot', k === i && 'is-on')} onClick={() => setI(k)}><span /></button>)}
          </div>
        </aside>
      )}
    </div>
  );
}
function ShowArt({ kind }) {
  if (kind === 'pix') return (
    <div className="rc-art rc-art-pix"><div className="rc-art-card"><p className="rc-art-small">Mensalidade de dezembro · Davi</p><p className="rc-art-big">R$ 1.620,00</p><span className="rc-art-btn">Pagar com Pix</span></div>
      <div className="rc-art-toast"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Pagamento recebido</div></div>
  );
  if (kind === 'gate') return (
    <div className="rc-art rc-art-gate"><div className="rc-art-card rc-art-gatecard"><span className="rc-art-photo">FL</span><div><p className="rc-art-small">Retirada autorizada · 2º ano B</p><p className="rc-art-name">Fernanda Lima, mãe</p><p className="rc-art-small">RG conferido às 17h42</p></div><span className="rc-art-ok"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span></div>
      <div className="rc-art-toast">Davi saiu com Fernanda às 17h43</div></div>
  );
  if (kind === 'kpi') return (
    <div className="rc-art rc-art-kpi">{[['Adimplência', '94,2%', 'verde', 94], ['Frequência hoje', '96,8%', 'azul', 97], ['Rematrículas 2027', '812', 'amarelo', 78]].map(([l, v, c, w], k) => (
      <div key={l} className="rc-art-kpirow" style={{ '--k': k }}><span className="rc-art-small">{l}</span><strong>{v}</strong><span className={`rc-art-bar rc-c-${c}`}><i style={{ width: `${w}%` }} /></span></div>))}</div>
  );
  if (kind === 'roster') return (
    <div className="rc-art rc-art-roster">{['Ana Beatriz Lima', 'Bruno Sales', 'Caio Nogueira', 'Davi Lima'].map((n, k) => <div key={n} className="rc-art-row" style={{ '--k': k }}><span className="rc-art-av">{n[0]}</span><span>{n}</span><span className={cx('rc-art-chip', k === 2 && 'is-f')}>{k === 2 ? 'F' : 'P'}</span></div>)}</div>
  );
  return (
    <div className="rc-art rc-art-today">{[['7h30', 'Entrada', 'door'], ['9h10', 'Prova de Ciências', 'edit'], ['10h00', 'Lanche: tapioca e cajá', 'utensils'], ['11h40', '3 fotos do laboratório', 'image']].map(([t, l, ic], k) => (
      <div key={t} className="rc-art-tl" style={{ '--k': k }}><span className="rc-art-t">{t}</span><span className="rc-art-node"><Icon name={ic} size={14} /></span><span>{l}</span></div>))}</div>
  );
}
