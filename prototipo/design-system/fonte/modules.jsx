import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cx, Icon, brl, num, useCountUp, useReducedMotion, useToast } from './core.jsx';
import { Button, IconButton, CopyButton, SegmentedControl } from './actions.jsx';
import { TextField, TextArea, Switch, FilterChips, FileDrop, RadioGroup, SearchField, Select, Checkbox } from './inputs.jsx';
import { Badge, StatusPill, ProgressBar, ProgressRing, EmptyState, Dialog, useUnsaved } from './feedback.jsx';
import { Avatar } from './data.jsx';
import { Stepper } from './navigation.jsx';
import { FakeQR } from './school.jsx';

/* =========================================================
   Comunicados
   ========================================================= */

/** Editor de comunicado da escola: público, prioridade, confirmação de leitura, agendamento e alcance. */
export function AnnouncementComposer({ audiences = [], defaultAudience = [], onSend, onSchedule }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [aud, setAud] = useState(defaultAudience);
  const [prio, setPrio] = useState('rotina');
  const [confirm, setConfirm] = useState(true);
  const [push, setPush] = useState(true);
  const [later, setLater] = useState(false);
  const [when, setWhen] = useState('27/11 às 07h00');
  const [sending, setSending] = useState(false);
  const reach = aud.reduce((t, id) => t + ((audiences.find((a) => a.id === id) || {}).count || 0), 0);
  const shown = useCountUp(reach, 500);
  const ok = title.trim().length > 3 && body.trim().length > 10 && aud.length > 0;
  const go = () => { setSending(true); setTimeout(() => { setSending(false); (later ? onSchedule : onSend) && (later ? onSchedule : onSend)({ title, body, aud, prio, confirm, push, when }); }, 1100); };
  return (
    <div className="rc-card rc-composer">
      <div className="rc-composer-main">
        <TextField label="Título" placeholder="Ex.: Feira de Ciências do 9º ano" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextArea label="Mensagem" rows={5} maxLength={1200} placeholder="Escreva o essencial nas duas primeiras linhas: elas viram o resumo da notificação." value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="rc-composer-row">
          <span className="rc-field-label">Prioridade</span>
          <SegmentedControl label="Prioridade" value={prio} onChange={setPrio} options={[{ value: 'rotina', label: 'Rotina' }, { value: 'importante', label: 'Importante', icon: 'flag' }, { value: 'urgente', label: 'Urgente', icon: 'alert' }]} />
        </div>
        <div className="rc-composer-row">
          <span className="rc-field-label">Para quem</span>
          <FilterChips label="Público" value={aud} onChange={setAud} options={audiences.map((a) => ({ value: a.id, label: a.label, count: num(a.count) }))} />
        </div>
      </div>
      <aside className="rc-composer-side">
        <div className="rc-composer-reach">
          <span className="rc-composer-reach-ico"><Icon name="users" size={22} /></span>
          <div><p className="rc-composer-reach-n">{num(Math.round(shown))}</p><p className="rc-muted">responsáveis vão receber</p></div>
        </div>
        <Switch label="Pedir confirmação de leitura" description="Você acompanha quem leu e lembra quem não leu." checked={confirm} onChange={setConfirm} />
        <Switch label="Enviar notificação no celular" checked={push} onChange={setPush} />
        <Switch label="Agendar envio" checked={later} onChange={setLater} />
        {later && <TextField label="Data e hora" value={when} onChange={(e) => setWhen(e.target.value)} icon="clock" />}
        {prio === 'urgente' && <p className="rc-composer-warn"><Icon name="alert" size={16} />Urgente toca o alerta no celular mesmo no modo silencioso. Use para saída antecipada, saúde e segurança.</p>}
        <Button variant="primary" size="lg" full icon={later ? 'clock' : 'send'} disabled={!ok} loading={sending} loadingLabel={later ? 'Agendando' : 'Enviando'} onClick={go}>{later ? 'Agendar comunicado' : 'Enviar agora'}</Button>
        {!ok && <p className="rc-composer-hint">Preencha título, mensagem e pelo menos um público.</p>}
      </aside>
    </div>
  );
}

/** Relatório de leitura de um comunicado: quantos leram, quantos confirmaram, quem falta e lembrete em lote. */
export function ReadReceipts({ title, total = 0, read = 0, confirmed = 0, pending = [], onRemind }) {
  const [sent, setSent] = useState(false);
  const pct = total ? Math.round((read / total) * 100) : 0;
  return (
    <div className="rc-card rc-receipts">
      <div className="rc-receipts-head">
        <ProgressRing value={pct} size={88} stroke={9} label={`${pct}% leram`} tone="brand"><strong>{pct}%</strong><span>leram</span></ProgressRing>
        <div className="rc-receipts-nums">
          {title && <p className="rc-title-sm">{title}</p>}
          <dl>
            <div><dt>Enviados</dt><dd>{num(total)}</dd></div>
            <div><dt>Leram</dt><dd className="is-brand">{num(read)}</dd></div>
            <div><dt>Confirmaram</dt><dd className="is-ok">{num(confirmed)}</dd></div>
            <div><dt>Sem leitura</dt><dd className="is-warn">{num(total - read)}</dd></div>
          </dl>
        </div>
      </div>
      <div className="rc-receipts-list">
        <div className="rc-receipts-bar"><span className="rc-overline">Ainda não leram</span>
          <Button size="sm" variant={sent ? 'ghost' : 'secondary'} icon={sent ? 'check' : 'bell'} onClick={() => { setSent(true); onRemind && onRemind(pending); }} disabled={sent}>{sent ? 'Lembrete enviado' : `Lembrar ${num(total - read)}`}</Button></div>
        <ul className="rc-zebra">
          {pending.map((p, i) => (
            <li key={p.name} style={{ '--i': i }}><Avatar name={p.name} size={30} /><span className="rc-receipts-name">{p.name}<small>{p.child}</small></span><span className="rc-receipts-group">{p.group}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* =========================================================
   Chat
   ========================================================= */

/** Caixa de entrada do chat: busca, filtros, não lidas e prévia da última mensagem. */
export function ConversationList({ conversations = [], active, onSelect, filters = ['Todas', 'Não lidas', 'Professores', 'Secretaria'] }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState([filters[0]]);
  const list = conversations.filter((c) => {
    if (q && !`${c.name} ${c.child || ''} ${c.last}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (f[0] === 'Não lidas') return c.unread > 0;
    if (f[0] === 'Professores') return c.kind === 'professor';
    if (f[0] === 'Secretaria') return c.kind === 'secretaria' || c.kind === 'coordenacao';
    return true;
  });
  return (
    <div className="rc-card rc-inbox">
      <div className="rc-inbox-top">
        <SearchField placeholder="Buscar conversa" shortcut="" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} size="sm" />
        <FilterChips single label="Filtrar conversas" value={f} onChange={(v) => setF(v.length ? v : [filters[0]])} options={filters} />
      </div>
      {list.length === 0 ? <EmptyState compact title="Nenhuma conversa encontrada">Tente outro nome ou limpe o filtro.</EmptyState> : (
        <ul className="rc-inbox-list">
          {list.map((c, i) => (
            <li key={c.id} style={{ '--i': i }}>
              <button type="button" className={cx('rc-inbox-item', active === c.id && 'is-active', c.unread > 0 && 'is-unread')} onClick={() => onSelect && onSelect(c.id)}>
                <Avatar name={c.name} size={44} status={c.online ? 'online' : undefined} />
                <span className="rc-inbox-body">
                  <span className="rc-inbox-line"><strong>{c.name}</strong><time>{c.time}</time></span>
                  <span className="rc-inbox-role">{c.role}{c.child && ` · ${c.child}`}</span>
                  <span className="rc-inbox-line"><span className="rc-inbox-last">{c.typing ? <em>digitando…</em> : c.last}</span>{c.unread > 0 && <Badge tone="brand" label={`${c.unread} não lidas`}>{c.unread}</Badge>}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =========================================================
   Financeiro: boleto e informe de IR
   ========================================================= */

/** Código de barras ilustrativo (não é um código válido). */
const Barcode = ({ seed = '0', height = 56 }) => {
  const bars = useMemo(() => { let h = 0; for (const c of seed) h = (h * 33 + c.charCodeAt(0)) >>> 0; const out = []; let x = 0; for (let i = 0; i < 70; i++) { h = (h * 1103515245 + 12345) >>> 0; const w = 1 + (h % 3); if (i % 2 === 0) out.push([x, w]); x += w + 1; } return { out, w: x }; }, [seed]);
  return <svg className="rc-barcode" viewBox={`0 0 ${bars.w} ${height}`} preserveAspectRatio="none" role="img" aria-label="Código de barras do boleto">{bars.out.map(([x, w]) => <rect key={x} x={x} y="0" width={w} height={height} />)}</svg>;
};
const BOLETO = { aberto: ['brand', 'clock', 'Em aberto'], vencido: ['danger', 'alert', 'Vencido'], pago: ['success', 'check-circle', 'Pago'], registrando: ['info', 'sync', 'Registrando no banco'] };
/** Boleto bancário: linha digitável com cópia, código de barras, segunda via e alternativa por Pix. */
export function BoletoCard({ competence, child, amount, due, line, status = 'aberto', payee = 'Colégio Recreio', fineNote, onDownload, onSecondCopy, onPix }) {
  const [tone, icon, label] = BOLETO[status] || BOLETO.aberto;
  return (
    <div className={cx('rc-card', 'rc-boleto', `is-${status}`)}>
      <div className="rc-boleto-head">
        <div><p className="rc-overline">Boleto · {competence}</p><p className="rc-boleto-amount">{brl(amount)}</p><p className="rc-muted">{child && `${child} · `}vence {due}</p></div>
        <StatusPill tone={tone} icon={icon}>{label}</StatusPill>
      </div>
      <div className="rc-boleto-code">
        <Barcode seed={line} />
        <p className="rc-boleto-line" aria-label="Linha digitável">{line}</p>
      </div>
      <dl className="rc-boleto-meta"><div><dt>Beneficiário</dt><dd>{payee}</dd></div><div><dt>Após o vencimento</dt><dd>{fineNote || 'Multa de 2% e juros de 1% ao mês'}</dd></div></dl>
      <div className="rc-boleto-actions">
        <CopyButton text={line.replace(/\D/g, '')} label="Copiar código" copiedLabel="Código copiado" variant="primary" />
        <Button icon="download" onClick={onDownload}>Baixar PDF</Button>
        {status === 'vencido' ? <Button icon="refresh" onClick={onSecondCopy}>Gerar segunda via</Button> : <Button variant="ghost" icon="qr" onClick={onPix}>Pagar com Pix</Button>}
      </div>
    </div>
  );
}

const maskDoc = (d) => d;
/** Informe de pagamentos para o Imposto de Renda: total do ano por dependente, dados da escola e código de autenticidade. */
export function TaxReceipt({ year = 2026, school = {}, payer = {}, dependents = [], code, onDownload, onEmail }) {
  const total = dependents.reduce((t, d) => t + d.total, 0);
  const shown = useCountUp(total, 900);
  return (
    <div className="rc-card rc-taxrec">
      <div className="rc-taxrec-head">
        <span className="rc-taxrec-ico"><Icon name="receipt" size={24} /></span>
        <div><p className="rc-overline">Imposto de Renda {year + 1} · ano-calendário {year}</p><h3 className="rc-taxrec-title">Informe de pagamentos com educação</h3></div>
        <StatusPill tone="success" icon="check-circle">Disponível</StatusPill>
      </div>
      <div className="rc-taxrec-parties">
        <div><p className="rc-overline">Escola</p><p className="rc-taxrec-strong">{school.name}</p><p className="rc-muted">CNPJ {school.cnpj}</p><p className="rc-muted">{school.address}</p></div>
        <div><p className="rc-overline">Responsável financeiro</p><p className="rc-taxrec-strong">{payer.name}</p><p className="rc-muted">CPF {maskDoc(payer.cpf)}</p></div>
      </div>
      <table className="rc-table rc-taxrec-table">
        <thead><tr><th>Dependente</th><th>Curso</th><th className="is-num">Pago em {year}</th></tr></thead>
        <tbody>{dependents.map((d, i) => <tr key={d.name} style={{ '--i': i }}><td><span className="rc-taxrec-dep"><Avatar name={d.name} size={28} /><span>{d.name}<small>CPF {maskDoc(d.cpf)}</small></span></span></td><td>{d.course}</td><td className="is-num">{brl(d.total)}</td></tr>)}</tbody>
        <tfoot><tr><td colSpan={2}>Total pago com educação</td><td className="is-num rc-taxrec-total">{brl(shown)}</td></tr></tfoot>
      </table>
      <p className="rc-taxrec-note"><Icon name="info" size={16} />Valores de mensalidade e matrícula. Material, uniforme, transporte e atividades extras não entram como despesa de educação. Confira o limite de dedução do ano na Receita Federal.</p>
      <div className="rc-taxrec-foot">
        <span className="rc-taxrec-code"><Icon name="shield" size={16} />Autenticidade: <code>{code}</code></span>
        <div className="rc-taxrec-actions"><Button icon="mail" onClick={onEmail}>Enviar por e-mail</Button><Button variant="primary" icon="download" onClick={onDownload}>Baixar PDF</Button></div>
      </div>
    </div>
  );
}

/* =========================================================
   Portaria
   ========================================================= */

const PICK = { autorizado: ['success', 'check-circle', 'Autorizado'], temporario: ['warning', 'clock', 'Autorização de hoje'], bloqueado: ['danger', 'lock', 'Não autorizado'] };
/** Retirada na portaria: quem veio buscar, foto, documento, validade, QR e confirmação de saída com aviso à família. */
export function PickupCard({ student = {}, person = {}, status = 'autorizado', validity, qr = 'retirada', onConfirm, onDeny }) {
  const [done, setDone] = useState(null);
  const [tone, icon, label] = PICK[status] || PICK.autorizado;
  const confirm = () => { const t = new Date(); const hh = `${String(t.getHours()).padStart(2, '0')}h${String(t.getMinutes()).padStart(2, '0')}`; setDone(hh); onConfirm && onConfirm(hh); };
  return (
    <div className={cx('rc-card', 'rc-pickup', `is-${status}`, done && 'is-done')}>
      <div className="rc-pickup-people">
        <div className="rc-pickup-person"><Avatar name={student.name} size={56} /><div><p className="rc-overline">Aluno</p><p className="rc-pickup-name">{student.name}</p><p className="rc-muted">{student.group}</p></div></div>
        <span className="rc-pickup-arrow" aria-hidden="true"><Icon name="arrow-right" size={20} /></span>
        <div className="rc-pickup-person"><Avatar name={person.name} size={56} /><div><p className="rc-overline">Quem busca</p><p className="rc-pickup-name">{person.name}</p><p className="rc-muted">{person.relation} · {person.doc}</p></div></div>
      </div>
      <div className="rc-pickup-mid">
        {status !== 'bloqueado' && <div className="rc-pickup-qr"><FakeQR seed={qr} size={104} label="QR de retirada" /></div>}
        <div className="rc-pickup-info">
          <StatusPill tone={tone} icon={icon}>{label}</StatusPill>
          {validity && <p className="rc-muted">{validity}</p>}
          {person.note && <p className="rc-pickup-note"><Icon name="info" size={16} />{person.note}</p>}
        </div>
      </div>
      {done ? (
        <div className="rc-pickup-ok" role="status"><span className="rc-pickup-check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span><div><p className="rc-title-sm">Saída registrada às {done}</p><p className="rc-muted">A família recebeu o aviso no celular.</p></div></div>
      ) : status === 'bloqueado' ? (
        <div className="rc-pickup-actions"><Button variant="danger" icon="phone" onClick={onDeny}>Ligar para o responsável</Button><Button icon="shield">Chamar coordenação</Button></div>
      ) : (
        <div className="rc-pickup-actions"><Button variant="primary" size="lg" icon="check" onClick={confirm}>Confirmar saída</Button><Button icon="x" onClick={onDeny}>Não liberar</Button></div>
      )}
    </div>
  );
}

const GATE = { entrada: ['verde', 'arrow-right', 'Entrada'], saida: ['azul', 'logout', 'Saída'], atraso: ['laranja', 'clock', 'Atraso'], visitante: ['roxo', 'user', 'Visitante'], antecipada: ['vermelho', 'alert', 'Saída antecipada'] };
/** Movimento da portaria do dia: contadores e registros ao vivo, com o mais recente em destaque. */
export function GateLog({ counts = {}, entries = [], live = true }) {
  const [f, setF] = useState([]);
  const list = f.length ? entries.filter((e) => f.includes(e.kind)) : entries;
  return (
    <div className="rc-card rc-gate">
      <div className="rc-gate-counts">
        {[['presentes', 'Na escola agora', 'verde', 'users'], ['saidas', 'Saídas', 'azul', 'logout'], ['atrasos', 'Atrasos', 'laranja', 'clock'], ['visitantes', 'Visitantes', 'roxo', 'user']].map(([k, l, c, ic]) => (
          <div key={k} className={cx('rc-gate-count', `rc-c-${c}`)}><span className="rc-gate-ico"><Icon name={ic} size={18} /></span><strong>{num(counts[k] || 0)}</strong><span>{l}</span></div>
        ))}
      </div>
      <div className="rc-gate-bar">
        <p className="rc-title-sm">Registros de hoje {live && <span className="rc-live"><i />ao vivo</span>}</p>
        <FilterChips label="Tipo" value={f} onChange={setF} options={Object.entries(GATE).map(([v, [, , label]]) => ({ value: v, label }))} />
      </div>
      <ul className="rc-gate-list">
        {list.map((e, i) => { const [c, ic, label] = GATE[e.kind] || GATE.entrada; return (
          <li key={`${e.time}${e.name}`} className={cx(i === 0 && live && 'is-new')} style={{ '--i': i }}>
            <time>{e.time}</time>
            <span className={cx('rc-gate-kind', `rc-c-${c}`)}><Icon name={ic} size={16} /></span>
            <span className="rc-gate-who"><strong>{e.name}</strong><small>{e.group}{e.by && ` · ${e.by}`}</small></span>
            <span className={cx('rc-gate-tag', `rc-c-${c}`)}>{label}</span>
          </li>
        ); })}
      </ul>
    </div>
  );
}

/* =========================================================
   Biblioteca
   ========================================================= */

const COVER = ['azul', 'verde', 'amarelo', 'laranja', 'vermelho', 'roxo', 'ciano', 'rosa'];
const coverOf = (t) => COVER[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % COVER.length];
/** Livro do acervo: capa gerada pela cor da categoria, disponibilidade e reserva. */
export function BookCard({ title, author, year, copies = 1, available = 0, shelf, tags = [], onReserve }) {
  const [reserved, setReserved] = useState(false);
  const c = coverOf(title);
  return (
    <div className="rc-card rc-book">
      <div className={cx('rc-book-cover', `rc-c-${c}`)} aria-hidden="true"><span className="rc-book-spine" /><p>{title}</p><small>{author}</small></div>
      <div className="rc-book-body">
        <p className="rc-book-title">{title}</p>
        <p className="rc-muted">{author}{year && ` · ${year}`}</p>
        <div className="rc-book-tags">{tags.map((t) => <span key={t}>{t}</span>)}</div>
        <div className="rc-book-foot">
          {available > 0 ? <StatusPill tone="success" icon="check-circle" size="sm">{available} de {copies} disponíveis</StatusPill> : <StatusPill tone="warning" icon="clock" size="sm">Todos emprestados</StatusPill>}
          {shelf && <span className="rc-book-shelf"><Icon name="pin" size={14} />{shelf}</span>}
        </div>
        <Button size="sm" variant={reserved ? 'ghost' : available > 0 ? 'primary' : 'secondary'} icon={reserved ? 'check' : 'bookmark'} disabled={reserved} onClick={() => { setReserved(true); onReserve && onReserve(title); }}>
          {reserved ? (available > 0 ? 'Separado para retirada' : 'Na fila de espera') : (available > 0 ? 'Reservar' : 'Entrar na fila')}
        </Button>
      </div>
    </div>
  );
}

const LOAN = { emdia: ['success', 'check-circle', 'No prazo'], vence: ['warning', 'clock', 'Vence amanhã'], atrasado: ['danger', 'alert', 'Atrasado'], devolvido: ['neutral', 'check', 'Devolvido'] };
/** Empréstimo da biblioteca: aluno, prazo, renovação e multa por atraso. */
export function LoanItem({ book, author, student, group, due, status = 'emdia', fine, renewals = 0, maxRenewals = 2, onRenew, onReturn, index = 0 }) {
  const [st, setSt] = useState(status); const [r, setR] = useState(renewals);
  const [tone, icon, label] = LOAN[st] || LOAN.emdia;
  return (
    <div className={cx('rc-loan', `is-${st}`)} style={{ '--i': index }}>
      <span className={cx('rc-loan-cover', `rc-c-${coverOf(book)}`)} aria-hidden="true"><Icon name="book" size={18} /></span>
      <div className="rc-loan-main"><p className="rc-loan-book">{book}<small>{author}</small></p><p className="rc-muted">{student} · {group}</p></div>
      <div className="rc-loan-due"><StatusPill tone={tone} icon={icon} size="sm">{label}</StatusPill><span className="rc-muted">{st === 'devolvido' ? 'devolvido' : `devolver até ${due}`}{fine ? ` · multa ${brl(fine)}` : ''}</span></div>
      <div className="rc-loan-actions">
        {st !== 'devolvido' && <Button size="sm" icon="refresh" disabled={r >= maxRenewals || st === 'atrasado'} onClick={() => { setR(r + 1); setSt('emdia'); onRenew && onRenew(); }}>{r >= maxRenewals ? 'Sem renovações' : `Renovar (${maxRenewals - r})`}</Button>}
        {st !== 'devolvido' && <Button size="sm" variant="ghost" icon="check" onClick={() => { setSt('devolvido'); onReturn && onReturn(); }}>Devolver</Button>}
      </div>
    </div>
  );
}

/* =========================================================
   Agenda e agenda online
   ========================================================= */

const AG = { prova: ['roxo', 'edit', 'Prova'], tarefa: ['azul', 'clipboard', 'Tarefa'], evento: ['amarelo', 'star', 'Evento'], reuniao: ['ciano', 'users', 'Reunião'], feriado: ['vermelho', 'flag', 'Sem aula'], passeio: ['verde', 'bus', 'Passeio'] };
/** Agenda da turma por dia: provas, tarefas, eventos e reuniões, com tarefa marcável como feita. */
export function AgendaList({ days = [], onToggle }) {
  const [done, setDone] = useState(() => new Set(days.flatMap((d) => d.items.filter((x) => x.done).map((x) => `${d.day}${x.title}`))));
  const kinds = Object.keys(AG);
  const [f, setF] = useState([]);
  const toggle = (k) => setDone((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); onToggle && onToggle(k); return n; });
  return (
    <div className="rc-agenda">
      <FilterChips label="Tipo" value={f} onChange={setF} options={kinds.map((k) => ({ value: k, label: AG[k][2] }))} />
      {days.map((d) => { const items = d.items.filter((x) => !f.length || f.includes(x.kind)); if (!items.length) return null; return (
        <section key={d.day} className="rc-agenda-day">
          <header className={cx('rc-agenda-date', d.today && 'is-today')}><strong>{d.day}</strong>{d.today && <Badge tone="accent">Hoje</Badge>}</header>
          <ul>
            {items.map((x, i) => { const [c, ic, label] = AG[x.kind] || AG.evento; const k = `${d.day}${x.title}`; const isDone = done.has(k); return (
              <li key={k} className={cx('rc-agenda-item', `rc-c-${c}`, isDone && 'is-done')} style={{ '--i': i }}>
                <span className="rc-agenda-time">{x.time || 'Dia todo'}</span>
                <span className="rc-agenda-ico"><Icon name={ic} size={18} /></span>
                <span className="rc-agenda-body"><span className="rc-agenda-kind">{label}{x.subject && ` · ${x.subject}`}</span><strong>{x.title}</strong>{x.meta && <small>{x.meta}</small>}</span>
                {x.kind === 'tarefa' && <button type="button" className={cx('rc-agenda-check', isDone && 'is-on')} aria-pressed={isDone} aria-label={isDone ? 'Marcar como não feita' : 'Marcar como feita'} onClick={() => toggle(k)}><Icon name="check" size={16} strokeWidth={2.5} /></button>}
              </li>
            ); })}
          </ul>
        </section>
      ); })}
    </div>
  );
}

/** Agenda online: a família escolhe com quem, o dia, o horário livre e o formato; confirmação animada. */
export function AppointmentPicker({ people = [], days = [], onBook }) {
  const [who, setWho] = useState(people[0] && people[0].id);
  const [day, setDay] = useState(days[0] && days[0].id);
  const [slot, setSlot] = useState(null);
  const [mode, setMode] = useState('presencial');
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(false);
  const d = days.find((x) => x.id === day) || { slots: [] };
  const p = people.find((x) => x.id === who) || {};
  if (booked) return (
    <div className="rc-card rc-appt rc-appt-done" role="status">
      <span className="rc-pickup-check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
      <h3 className="rc-title-md">Reunião marcada</h3>
      <p className="rc-muted">{p.name} · {d.label} às {slot} · {mode === 'online' ? 'por vídeo, o link chega 10 minutos antes' : 'na sala da coordenação'}</p>
      <div className="rc-appt-done-actions"><Button icon="calendar">Adicionar ao calendário</Button><Button variant="ghost" onClick={() => { setBooked(false); setSlot(null); }}>Marcar outra</Button></div>
    </div>
  );
  return (
    <div className="rc-card rc-appt">
      <RadioGroup legend="Com quem" variant="cards" columns={people.length > 2 ? 3 : 2} value={who} onChange={(v) => { setWho(v); setSlot(null); }}
        options={people.map((x) => ({ value: x.id, label: x.name, description: x.role, icon: x.icon || 'user' }))} />
      <div className="rc-appt-days" role="group" aria-label="Dia">
        {days.map((x) => (
          <button key={x.id} type="button" className={cx('rc-appt-day', day === x.id && 'is-on')} aria-pressed={day === x.id} onClick={() => { setDay(x.id); setSlot(null); }}>
            <small>{x.week}</small><strong>{x.num}</strong>{(() => { const n = x.slots.filter((s) => s.free).length; return <span className={cx(!n && 'is-full')}>{n === 0 ? 'lotado' : n === 1 ? '1 livre' : `${n} livres`}</span>; })()}
          </button>
        ))}
      </div>
      <div className="rc-appt-slots" role="group" aria-label="Horário">
        {d.slots.map((s, i) => (
          <button key={s.time} type="button" disabled={!s.free} className={cx('rc-appt-slot', slot === s.time && 'is-on')} aria-pressed={slot === s.time} style={{ '--i': i }} onClick={() => setSlot(s.time)}>{s.time}</button>
        ))}
      </div>
      <div className="rc-appt-foot">
        <SegmentedControl label="Formato" value={mode} onChange={setMode} options={[{ value: 'presencial', label: 'Presencial', icon: 'school' }, { value: 'online', label: 'Por vídeo', icon: 'video' }]} />
        <Button variant="primary" size="lg" icon="calendar" disabled={!slot} loading={busy} loadingLabel="Marcando" onClick={() => { setBusy(true); setTimeout(() => { setBusy(false); setBooked(true); onBook && onBook({ who, day, slot, mode }); }, 1000); }}>
          {slot ? `Marcar ${d.week ? d.week.toLowerCase() : ''} ${d.num} às ${slot}` : 'Escolha um horário'}
        </Button>
      </div>
    </div>
  );
}

/* =========================================================
   Ocorrências
   ========================================================= */

const OC = { disciplinar: ['laranja', 'alert', 'Disciplinar'], pedagogica: ['azul', 'book', 'Pedagógica'], saude: ['vermelho', 'heart', 'Saúde'], elogio: ['verde', 'star', 'Elogio'], atraso: ['amarelo', 'clock', 'Atraso'] };
/** Ocorrência do aluno: tipo, gravidade, relato, providência e ciência do responsável. */
export function OccurrenceCard({ kind = 'disciplinar', level, student, group, date, author, children, measures, acknowledged, ackBy, onAcknowledge, guardianView }) {
  const [ack, setAck] = useState(acknowledged);
  const [c, ic, label] = OC[kind] || OC.disciplinar;
  return (
    <article className={cx('rc-card', 'rc-occ', `rc-c-${c}`)}>
      <header className="rc-occ-head">
        <span className="rc-occ-ico"><Icon name={ic} size={20} /></span>
        <div className="rc-occ-titles"><p className="rc-occ-kind">{label}{level && <span className="rc-occ-level">{level}</span>}</p><p className="rc-muted">{student}{group && ` · ${group}`} · {date}</p></div>
        {ack ? <StatusPill tone="success" icon="check-circle" size="sm">Ciente</StatusPill> : <StatusPill tone="warning" icon="clock" size="sm">Aguardando ciência</StatusPill>}
      </header>
      <div className="rc-occ-body">{children}</div>
      {measures && <p className="rc-occ-measure"><Icon name="clipboard" size={16} /><span><strong>Providência:</strong> {measures}</span></p>}
      <footer className="rc-occ-foot">
        <span className="rc-muted">Registrado por {author}</span>
        {ack ? <span className="rc-muted">{ackBy || 'Responsável'} deu ciência</span> : guardianView
          ? <Button size="sm" variant="primary" icon="check" onClick={() => { setAck(true); onAcknowledge && onAcknowledge(); }}>Estou ciente</Button>
          : <Button size="sm" icon="bell">Lembrar responsável</Button>}
      </footer>
    </article>
  );
}

/* =========================================================
   Matrícula
   ========================================================= */

const DOC = { aprovado: ['success', 'check-circle', 'Aprovado'], enviado: ['info', 'clock', 'Em análise'], pendente: ['warning', 'upload', 'Falta enviar'], recusado: ['danger', 'x-circle', 'Refazer'] };
/** Matrícula e rematrícula: etapas, documentos com status, contrato e assinatura eletrônica. */
export function EnrollmentChecklist({ student, year = 2027, step = 1, documents = [], contract = {}, onSign }) {
  const [docs, setDocs] = useState(documents);
  const [signed, setSigned] = useState(!!contract.signedAt);
  const [signing, setSigning] = useState(false);
  const ok = docs.filter((d) => d.status === 'aprovado' || d.status === 'enviado').length;
  const upload = (name) => setDocs((ds) => ds.map((d) => (d.name === name ? { ...d, status: 'enviado', note: 'Enviado agora. A secretaria confere em até 1 dia útil.' } : d)));
  return (
    <div className="rc-card rc-enroll">
      <div className="rc-enroll-head">
        <div><p className="rc-overline">Rematrícula {year}</p><h3 className="rc-title-md">{student}</h3></div>
        <ProgressRing value={Math.round(((ok + (signed ? 1 : 0)) / (docs.length + 1)) * 100)} size={64} stroke={7} label="Progresso da matrícula" tone="success" />
      </div>
      <Stepper current={signed ? 3 : step} steps={[{ label: 'Dados' }, { label: 'Documentos' }, { label: 'Contrato' }, { label: 'Pagamento' }]} />
      <ul className="rc-enroll-docs">
        {docs.map((d, i) => { const [tone, icon, label] = DOC[d.status] || DOC.pendente; return (
          <li key={d.name} className={cx(`is-${d.status}`)} style={{ '--i': i }}>
            <Icon name="file-text" size={20} />
            <span className="rc-enroll-doc">{d.name}{d.note && <small>{d.note}</small>}</span>
            <StatusPill tone={tone} icon={icon} size="sm">{label}</StatusPill>
            {(d.status === 'pendente' || d.status === 'recusado') && <Button size="sm" icon="upload" onClick={() => upload(d.name)}>Enviar</Button>}
          </li>
        ); })}
      </ul>
      <div className={cx('rc-enroll-contract', signed && 'is-signed')}>
        <Icon name={signed ? 'check-circle' : 'edit'} size={22} />
        <div><p className="rc-title-sm">Contrato de prestação de serviços {year}</p><p className="rc-muted">{signed ? `Assinado eletronicamente ${contract.signedAt || 'agora'}` : contract.summary || '12 parcelas, vencimento dia 10, desconto de pontualidade de 5%.'}</p></div>
        {!signed && <Button variant="primary" icon="edit" loading={signing} loadingLabel="Assinando" onClick={() => { setSigning(true); setTimeout(() => { setSigning(false); setSigned(true); onSign && onSign(); }, 1200); }}>Assinar contrato</Button>}
      </div>
    </div>
  );
}

/* =========================================================
   Acompanhamento: regular, tempo integral, semi-integral e reforço
   ========================================================= */

const PROG = { regular: ['azul', 'school', 'Regular'], integral: ['verde', 'sun-moon', 'Tempo integral'], semi: ['amarelo', 'sun', 'Semi-integral'], reforco: ['roxo', 'target', 'Reforço'] };
const BLK = { feito: 'Feito', agora: 'Agora', proximo: 'Depois' };
/** Acompanhamento do dia do aluno por modalidade: turno regular, tempo integral, semi-integral e reforço. */
export function ProgramTracker({ student, programs = ['regular'], week = [], blocks = [], summary }) {
  const [f, setF] = useState('todos');
  const list = f === 'todos' ? blocks : blocks.filter((b) => b.program === f);
  return (
    <div className="rc-card rc-prog">
      <div className="rc-prog-head">
        <div><p className="rc-overline">Acompanhamento</p><h3 className="rc-title-md">{student}</h3>
          <div className="rc-prog-badges">{programs.map((p) => { const [c, ic, l] = PROG[p]; return <span key={p} className={cx('rc-prog-badge', `rc-c-${c}`)}><Icon name={ic} size={14} />{l}</span>; })}</div></div>
        <div className="rc-prog-week" aria-label="Presença na semana">
          {week.map((w) => (
            <span key={w.day} className={cx('rc-prog-wd', w.today && 'is-today')}><small>{w.day}</small>
              <span className="rc-prog-dots">{programs.map((p) => <i key={p} className={cx(`rc-c-${PROG[p][0]}`, w[p] === true && 'is-on', w[p] === false && 'is-off')} title={`${PROG[p][2]}: ${w[p] === true ? 'presente' : w[p] === false ? 'faltou' : 'sem atividade'}`} />)}</span>
            </span>
          ))}
        </div>
      </div>
      <SegmentedControl label="Modalidade" value={f} onChange={setF} options={[{ value: 'todos', label: 'Dia inteiro' }, ...programs.map((p) => ({ value: p, label: PROG[p][2] }))]} />
      <ol className="rc-prog-list">
        {list.map((b, i) => { const [c, ic] = PROG[b.program] || PROG.regular; return (
          <li key={`${b.time}${b.title}`} className={cx('rc-prog-item', `rc-c-${c}`, `is-${b.status}`)} style={{ '--i': i }}>
            <time>{b.time}</time>
            <span className="rc-prog-node"><Icon name={b.icon || ic} size={16} /></span>
            <div className="rc-prog-body"><p><strong>{b.title}</strong><span className="rc-prog-st">{BLK[b.status]}</span></p>{b.note && <p className="rc-muted">{b.note}</p>}{b.by && <small>{b.by}</small>}</div>
          </li>
        ); })}
      </ol>
      {summary && <p className="rc-prog-summary"><Icon name="info" size={16} />{summary}</p>}
    </div>
  );
}

const INTG_ACTS = [
  { id: 'almoco', time: '11h50', title: 'Almoço', icon: 'utensils', program: 'integral', col: true, options: [['tudo', 'Comeu tudo', 'success'], ['quase', 'Quase tudo', 'success'], ['pouco', 'Comeu pouco', 'warning'], ['nao', 'Não comeu', 'danger']] },
  { id: 'descanso', time: '12h40', title: 'Descanso', icon: 'bed', program: 'integral', options: [['dormiu', 'Dormiu', 'success'], ['descansou', 'Descansou', 'success'], ['nao', 'Não descansou', 'warning']] },
  { id: 'estudo', time: '13h30', title: 'Estudo dirigido', icon: 'edit', program: 'integral', col: true, subject: true, options: [['concluida', 'Concluída', 'success'], ['fazendo', 'Fazendo', 'brand'], ['nao', 'Não começou', 'warning']] },
  { id: 'reforco', time: '14h40', title: 'Reforço', icon: 'target', program: 'reforco', col: true, options: [['participou', 'Participou', 'success'], ['faltou', 'Faltou', 'danger']] },
  { id: 'oficina', time: '15h30', title: 'Oficina', icon: 'sparkline', program: 'integral', only: 'integral', options: [['participou', 'Participou', 'success'], ['nao', 'Não participou', 'warning']] },
  { id: 'saida', time: '17h00', title: 'Saída', icon: 'logout', program: 'integral', col: true, options: [['saiu', 'Saiu', 'success'], ['na-escola', 'Ainda na escola', 'neutral']] },
];
const INTG_SHORT = { regular: 'Regular', integral: 'Integral', semi: 'Semi', reforco: 'Reforço' };
const INTG_SUBJ = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Tarefa de casa'];
const intgHora = () => { const d = new Date(); return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`; };
/** Rotina do integral e do reforço: a lista dos alunos que a pessoa alcança e, ao escolher um, o lançamento do dia dele. O que é salvo aqui aparece para a família. */
export function IntegralBoard({ students = [], activities = INTG_ACTS, subjects = INTG_SUBJ, scope = 'meus', groups = [], by = 'Camila Rocha', date = 'quarta, 25/11', defaultSelected = null, familyHref, recordHref, onSave }) {
  const initL = () => Object.fromEntries(students.map((s) => [s.id, { ...(s.log || {}) }]));
  const initN = () => Object.fromEntries(students.map((s) => [s.id, s.note || '']));
  const [logs, setLogs] = useState(initL); const [base, setBase] = useState(initL);
  const [notes, setNotes] = useState(initN); const [baseN, setBaseN] = useState(initN);
  const [sel, setSel] = useState(defaultSelected);
  const [q, setQ] = useState(''); const [prog, setProg] = useState([]); const [sit, setSit] = useState([]);
  const [grp, setGrp] = useState('todos'); const [klass, setKlass] = useState('todas');
  const [bulk, setBulk] = useState(null);
  const [saving, setSaving] = useState(false); const [savedAt, setSavedAt] = useState('');
  const actsOf = (s) => activities.filter((a) => (a.program === 'reforco' ? s.programs.includes('reforco') : a.only ? s.programs.includes(a.only) : s.programs.includes('integral') || s.programs.includes('semi')));
  const cell = (sid, aid) => (logs[sid] && logs[sid][aid]) || {};
  const done = (s) => actsOf(s).filter((a) => cell(s.id, a.id).v).length;
  const same = (x, y) => JSON.stringify(x || {}) === JSON.stringify(y || {});
  const changed = students.filter((s) => notes[s.id] !== baseN[s.id] || activities.some((a) => !same(cell(s.id, a.id), base[s.id] && base[s.id][a.id])));
  const dirty = students.reduce((n, s) => n + (notes[s.id] !== baseN[s.id] ? 1 : 0) + activities.filter((a) => !same(cell(s.id, a.id), base[s.id] && base[s.id][a.id])).length, 0);
  const put = (sid, aid, patch) => setLogs((o) => { const cur = (o[sid] && o[sid][aid]) || {}; const nx = { ...cur, ...patch }; if (!nx.v && !nx.note) { const r = { ...o[sid] }; delete r[aid]; return { ...o, [sid]: r }; } return { ...o, [sid]: { ...o[sid], [aid]: nx } }; });
  const klasses = useMemo(() => [...new Set(students.map((s) => s.klass))], [students]);
  const list = students.filter((s) => (grp === 'todos' || s.group === grp) && (klass === 'todas' || s.klass === klass)
    && (!prog.length || prog.some((p) => s.programs.includes(p)))
    && (!sit.length || (sit[0] === 'pendente' ? done(s) < actsOf(s).length : done(s) === actsOf(s).length))
    && (!q.trim() || s.name.toLowerCase().includes(q.trim().toLowerCase())));
  const toast = useToast();
  const commit = () => { toast.show({ tone: 'success', title: 'Lançamentos salvos', message: `As famílias de ${changed.length} ${changed.length === 1 ? 'aluno já veem' : 'alunos já veem'} no app.` }); setBase(logs); setBaseN(notes); setSavedAt(intgHora()); onSave && onSave({ logs, notes }); };
  const save = () => { setSaving(true); setTimeout(() => { setSaving(false); commit(); }, 700); };
  const discard = () => { setLogs(base); setNotes(baseN); };
  const leave = useUnsaved(dirty > 0, { onSave: commit, children: 'Há lançamentos do integral que ainda não foram salvos. Se você sair agora, as famílias não recebem o que você marcou.' });
  const cols = activities.filter((a) => a.col);
  const pill = (s, a) => {
    if (!actsOf(s).includes(a)) return <span className="rc-intg-na">Não faz</span>;
    const c = cell(s.id, a.id); const o = a.options.find((x) => x[0] === c.v);
    return o ? <StatusPill size="sm" tone={o[2]}>{o[1]}</StatusPill> : <span className="rc-intg-todo">A lançar</span>;
  };
  const bAct = bulk && activities.find((a) => a.id === bulk.act);
  const bTargets = bulk ? list.filter((s) => actsOf(s).includes(bAct) && (bulk.only === 'todos' || !cell(s.id, bAct.id).v)) : [];
  const applyBulk = () => { bTargets.forEach((s) => put(s.id, bAct.id, { v: bulk.v, ...(bulk.note ? { note: bulk.note } : {}), ...(bAct.subject ? { subject: bulk.subject } : {}) })); setBulk(null); };
  const myGroups = groups.filter((g) => g.value !== 'todos');
  return (
    <div className="rc-card rc-intg">
      <div className="rc-intg-head">
        <div><p className="rc-overline">Rotina de hoje · {date}</p><h3 className="rc-title-md">{scope === 'todos' ? 'Todos os alunos do integral e do reforço' : 'Alunos dos seus grupos'}</h3></div>
        <Button variant="secondary" icon="users" onClick={() => { const pend = (x) => list.filter((st) => actsOf(st).includes(x) && !cell(st.id, x.id).v).length; const a0 = activities.find((x) => pend(x) > 1) || activities.find((x) => pend(x) > 0) || activities[0]; setBulk({ act: a0.id, v: a0.options[0][0], note: '', subject: subjects[0], only: 'pendentes' }); }}>Lançar para o grupo</Button>
      </div>
      <div className="rc-intg-filters">
        {scope === 'todos' ? (
          <div className="rc-intg-selects">
            <Select size="sm" label="Grupo" value={grp} onChange={(e) => { setGrp(e.target.value); setSel(null); }} options={[{ value: 'todos', label: 'Todos os grupos' }, ...myGroups]} />
            <Select size="sm" label="Turma" value={klass} onChange={(e) => { setKlass(e.target.value); setSel(null); }} options={[{ value: 'todas', label: 'Todas as turmas' }, ...klasses.map((k) => ({ value: k, label: k }))]} />
          </div>
        ) : (
          <p className="rc-intg-scope"><Icon name="lock" size={16} /><span>Você vê só os seus grupos: <strong>{myGroups.map((g) => g.label).join(', ') || 'nenhum grupo'}</strong>. A coordenação define isso na sua ficha, em Equipe.</span></p>
        )}
        <div className="rc-intg-chips">
          <FilterChips label="Modalidade" value={prog} onChange={setProg} options={[{ value: 'integral', label: 'Tempo integral' }, { value: 'semi', label: 'Semi-integral' }, { value: 'reforco', label: 'Reforço' }]} />
          <FilterChips single label="Situação" value={sit} onChange={setSit} options={[{ value: 'pendente', label: 'Com lançamento a fazer', count: students.filter((s) => done(s) < actsOf(s).length).length }, { value: 'completo', label: 'Completos' }]} />
          <SearchField size="sm" shortcut={null} placeholder="Buscar aluno" label="Buscar aluno" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} />
        </div>
      </div>
      <div className="rc-intg-list" role="list">
        <div className="rc-intg-cols" aria-hidden="true"><span>Aluno</span><span>Modalidade</span>{cols.map((a) => <span key={a.id}>{a.title}</span>)}<span>Lançado</span><span /></div>
        {list.length === 0 && <EmptyState compact title="Nenhum aluno neste filtro">Mude a modalidade, a situação ou a busca.</EmptyState>}
        {list.map((s) => { const open = sel === s.id; const acts = actsOf(s); const d = done(s); const ch = changed.includes(s); return (
          <div key={s.id} role="listitem" className={cx('rc-intg-item', open && 'is-open')}>
            <button type="button" className="rc-intg-row" aria-expanded={open} onClick={() => setSel(open ? null : s.id)}>
              <span className="rc-intg-who"><Avatar name={s.name} size={32} /><span><strong>{s.name}</strong><small>{s.klass} · sai às {s.exit}</small></span>{s.alert && <span className="rc-intg-alert" title={s.alert}><Icon name="alert" size={14} /><span className="rc-sr">{s.alert}</span></span>}</span>
              <span className="rc-intg-progs">{s.programs.map((p) => { const [c, ic, l] = PROG[p]; return <span key={p} className={cx('rc-prog-badge', `rc-c-${c}`)} title={l}><Icon name={ic} size={12} />{INTG_SHORT[p] || l}</span>; })}</span>
              {cols.map((a) => <span key={a.id} className="rc-intg-cell" data-label={a.title}>{pill(s, a)}</span>)}
              <span className="rc-intg-count"><ProgressBar size="sm" value={d} max={acts.length} tone={d === acts.length ? 'success' : 'brand'} hideLabel label={`Lançamentos de ${s.name}`} /><small>{d} de {acts.length}{ch ? ' · sem salvar' : ''}</small></span>
              <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} className="rc-intg-caret" />
            </button>
            {open && (
              <div className="rc-intg-detail">
                <div className="rc-intg-main">
                  {s.alert && <p className="rc-intg-alertbar" role="note"><Icon name="alert" size={16} /><span>{s.alert}</span></p>}
                  <p className="rc-overline">Lançar a rotina de {s.name.split(' ')[0]}</p>
                  <ol className="rc-intg-acts">
                    {acts.map((a) => { const c = cell(s.id, a.id); const [col] = PROG[a.program] || PROG.integral; const b0 = base[s.id] && base[s.id][a.id]; return (
                      <li key={a.id} className={cx('rc-intg-act', `rc-c-${col}`, c.v && 'is-done')}>
                        <time>{a.time}</time>
                        <span className="rc-prog-node"><Icon name={a.icon} size={16} /></span>
                        <div className="rc-intg-actbody">
                          <p className="rc-intg-acttitle"><strong>{a.title}{a.id === 'reforco' && s.reforco ? ` de ${s.reforco.group.toLowerCase()}` : ''}{a.id === 'oficina' && s.workshop ? ` de ${s.workshop.toLowerCase()}` : ''}</strong>
                            <span className={cx('rc-intg-state', c.v ? (same(c, b0) ? 'is-saved' : 'is-new') : 'is-todo')}>{c.v ? (same(c, b0) ? `Lançado por ${c.by || by}${c.at ? ` às ${c.at}` : ''}` : 'Sem salvar') : 'A lançar'}</span></p>
                          <FilterChips single label={a.title} value={c.v ? [c.v] : []} onChange={(v) => put(s.id, a.id, { v: v[0] || '' })} options={a.options.map((o) => ({ value: o[0], label: o[1] }))} />
                          <div className="rc-intg-extra">
                            {a.subject && <Select size="sm" label="Disciplina" value={c.subject || subjects[0]} onChange={(e) => put(s.id, a.id, { subject: e.target.value })} options={subjects} />}
                            {a.id === 'saida' && <Select size="sm" label="Quem buscou" value={c.pickup || (s.pickups && s.pickups[0]) || ''} onChange={(e) => put(s.id, a.id, { pickup: e.target.value })} options={s.pickups || []} />}
                            <TextField size="sm" label="Observação para a família" optional placeholder={a.id === 'estudo' ? 'Ex.: dezenas e unidades, página 42' : 'Opcional'} value={c.note || ''} onChange={(e) => put(s.id, a.id, { note: e.target.value })} />
                          </div>
                        </div>
                      </li>
                    ); })}
                  </ol>
                </div>
                <aside className="rc-intg-side">
                  <section><p className="rc-overline">Semana</p>
                    <ul className="rc-intg-week">{(s.week || []).map((w) => (
                      <li key={w.day} className={cx(w.today && 'is-today')}><strong>{w.day}</strong><span>{w.text}</span>{w.today && <small>Hoje</small>}</li>
                    ))}</ul></section>
                  <section><p className="rc-overline">Saída</p><p className="rc-intg-line"><Icon name="clock" size={16} />Prevista para {s.exit}</p>{s.pickups && <p className="rc-intg-line"><Icon name="key" size={16} />Pode buscar: {s.pickups.join(', ')}</p>}</section>
                  {s.reforco && <section><p className="rc-overline">Reforço de {s.reforco.group.toLowerCase()}</p><ProgressBar value={s.reforco.level} max={s.reforco.max || 4} tone="brand" hideLabel label={`Nível ${s.reforco.level} de ${s.reforco.max || 4}`} /><p className="rc-intg-line">Nível {s.reforco.level} de {s.reforco.max || 4}. {s.reforco.note}</p></section>}
                  <section><TextArea label="Recado do dia para a família" optional rows={3} placeholder="Ex.: hoje o Davi leu sozinho uma página inteira." value={notes[s.id]} onChange={(e) => setNotes((o) => ({ ...o, [s.id]: e.target.value }))} /></section>
                  <div className="rc-intg-links">{familyHref && <a className="rc-btn rc-btn-ghost rc-btn-sm" href={familyHref}><Icon name="eye" size={16} />Ver como a família vê</a>}{recordHref && <a className="rc-btn rc-btn-ghost rc-btn-sm" href={recordHref}><Icon name="user" size={16} />Abrir a ficha</a>}</div>
                </aside>
              </div>
            )}
          </div>
        ); })}
      </div>
      {sel == null && list.length > 0 && <p className="rc-intg-hint"><Icon name="info" size={16} />Escolha um aluno na lista para ver e lançar a rotina dele. Nada aparece sem um aluno selecionado.</p>}
      <div className={cx('rc-savebar', 'rc-intg-save', dirty > 0 && 'is-dirty')} role="group" aria-label="Salvar lançamentos">
        <p className="rc-savebar-status" aria-live="polite"><Icon name={dirty > 0 ? 'clock' : 'check'} size={16} /><span>{dirty > 0 ? `${dirty} ${dirty === 1 ? 'lançamento' : 'lançamentos'} sem salvar, de ${changed.length} ${changed.length === 1 ? 'aluno' : 'alunos'}. A família só vê depois de salvar.` : savedAt ? `Salvo às ${savedAt}. As famílias já veem no app.` : 'Nenhum lançamento para salvar'}</span></p>
        <Button variant="ghost" disabled={!dirty || saving} onClick={discard}>Descartar</Button>
        <Button variant="primary" icon="send" disabled={!dirty} loading={saving} loadingLabel="Salvando" onClick={save}>Salvar e avisar as famílias</Button>
      </div>
      <Dialog open={!!bulk} onClose={() => setBulk(null)} title="Lançar para o grupo" description="Marca a mesma atividade para vários alunos de uma vez. Depois você ajusta as exceções aluno por aluno." icon="users" size="md"
        footer={<><Button variant="ghost" onClick={() => setBulk(null)}>Cancelar</Button><Button variant="primary" disabled={!bulk || !bTargets.length} onClick={applyBulk}>{`Aplicar a ${bTargets.length} ${bTargets.length === 1 ? 'aluno' : 'alunos'}`}</Button></>}>
        {bulk && <div className="rc-intg-bulk">
          <Select label="Atividade" value={bulk.act} onChange={(e) => { const a = activities.find((x) => x.id === e.target.value); setBulk((b) => ({ ...b, act: a.id, v: a.options[0][0] })); }} options={activities.map((a) => ({ value: a.id, label: `${a.time} · ${a.title}` }))} />
          <div><span className="rc-field-label">Situação</span><FilterChips single label="Situação" value={[bulk.v]} onChange={(v) => v[0] && setBulk((b) => ({ ...b, v: v[0] }))} options={bAct.options.map((o) => ({ value: o[0], label: o[1] }))} /></div>
          {bAct.subject && <Select label="Disciplina" value={bulk.subject} onChange={(e) => setBulk((b) => ({ ...b, subject: e.target.value }))} options={subjects} />}
          <TextField label="Observação para as famílias" optional placeholder="Ex.: hoje teve fruta de sobremesa" value={bulk.note} onChange={(e) => setBulk((b) => ({ ...b, note: e.target.value }))} />
          <RadioGroup legend="Aplicar em" variant="list" value={bulk.only} onChange={(v) => setBulk((b) => ({ ...b, only: v }))} options={[{ value: 'pendentes', label: 'Só quem ainda não tem esse lançamento' }, { value: 'todos', label: 'Todos os alunos do filtro', description: 'Troca o que já estava lançado.' }]} />
        </div>}
      </Dialog>
      {leave.dialog}
    </div>
  );
}

const RT_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
/** Grade semanal de um grupo do integral: horário, atividade, modalidade, dias e responsável. É daqui que sai a rotina que o monitor lança e a família acompanha. */
export function RoutineEditor({ blocks: b0 = [], people = [], group = 'Integral Fund I · Tarde', onSave }) {
  const [rows, setRows] = useState(b0); const [base, setBase] = useState(b0);
  const [saving, setSaving] = useState(false); const [savedAt, setSavedAt] = useState('');
  const key = (r) => JSON.stringify([r.time, r.end, r.title, r.program, r.days, r.who]);
  const dirty = rows.filter((r) => { const o = base.find((x) => x.id === r.id); return !o || key(o) !== key(r); }).length + base.filter((o) => !rows.some((r) => r.id === o.id)).length;
  const invalid = rows.some((r) => !String(r.title || '').trim() || !String(r.time || '').trim() || !(r.days || []).length);
  const set = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const toggle = (r, d) => set(r.id, { days: r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d].sort() });
  const add = () => setRows((rs) => [...rs, { id: `n${Date.now()}`, time: '', end: '', title: '', program: 'integral', days: [0, 1, 2, 3, 4], who: people[0] || '' }]);
  const toast = useToast();
  const commit = () => { toast.show({ tone: 'success', title: 'Grade salva', message: 'Vale a partir de amanhã para os monitores e as famílias.' }); setBase(rows); setSavedAt(intgHora()); onSave && onSave(rows); };
  const leave = useUnsaved(dirty > 0, { onSave: invalid ? undefined : commit, children: 'A grade tem alterações que ainda não foram salvas. Se você sair agora, a rotina dos monitores continua como estava.' });
  return (
    <div className="rc-routine">
      <div className="rc-routine-cols" aria-hidden="true"><span>Início</span><span>Fim</span><span>Atividade</span><span>Modalidade</span><span>Dias</span><span>Quem lança</span><span /></div>
      <ul className="rc-routine-list">
        {rows.map((r) => { const [c] = PROG[r.program] || PROG.integral; return (
          <li key={r.id} className={cx('rc-routine-row', `rc-c-${c}`)}>
            <TextField size="sm" aria-label="Início" placeholder="11h50" value={r.time} onChange={(e) => set(r.id, { time: e.target.value })} />
            <TextField size="sm" aria-label="Fim" placeholder="12h40" value={r.end || ''} onChange={(e) => set(r.id, { end: e.target.value })} />
            <TextField size="sm" aria-label="Atividade" placeholder="Nome da atividade" value={r.title} error={!String(r.title || '').trim() ? 'Dê um nome' : undefined} onChange={(e) => set(r.id, { title: e.target.value })} />
            <Select size="sm" value={r.program} onChange={(e) => set(r.id, { program: e.target.value })} options={[{ value: 'integral', label: 'Integral e semi' }, { value: 'reforco', label: 'Reforço' }]} />
            <span className="rc-routine-days" role="group" aria-label={`Dias de ${r.title || 'atividade'}`}>{RT_DAYS.map((d, i) => <button key={d} type="button" aria-pressed={r.days.includes(i)} className={cx(r.days.includes(i) && 'is-on')} title={d} onClick={() => toggle(r, i)}>{d.charAt(0)}</button>)}</span>
            <Select size="sm" value={r.who} onChange={(e) => set(r.id, { who: e.target.value })} options={people} />
            <IconButton icon="trash" label={`Remover ${r.title || 'atividade'}`} onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} />
          </li>
        ); })}
      </ul>
      {rows.length === 0 && <EmptyState compact title="Nenhuma atividade na grade">Adicione a primeira atividade do grupo.</EmptyState>}
      <div><Button variant="secondary" icon="plus" onClick={add}>Adicionar atividade</Button></div>
      <div className={cx('rc-savebar', dirty > 0 && 'is-dirty')} role="group" aria-label="Salvar grade">
        <p className="rc-savebar-status" aria-live="polite"><Icon name={dirty > 0 ? 'clock' : 'check'} size={16} /><span>{dirty > 0 ? (invalid ? 'Preencha horário, nome e dias de cada atividade para salvar' : `${dirty} ${dirty === 1 ? 'alteração' : 'alterações'} sem salvar na grade de ${group}`) : savedAt ? `Grade salva às ${savedAt}. Vale a partir de amanhã.` : 'Nenhuma alteração para salvar'}</span></p>
        <Button variant="ghost" disabled={!dirty || saving} onClick={() => setRows(base)}>Descartar</Button>
        <Button variant="primary" icon="check" disabled={!dirty || invalid} loading={saving} loadingLabel="Salvando" onClick={() => { setSaving(true); setTimeout(() => { setSaving(false); commit(); }, 600); }}>Salvar grade</Button>
      </div>
      {leave.dialog}
    </div>
  );
}

const AS_ST = { aberta: ['brand', 'Para entregar'], refazer: ['warning', 'Refazer'], entregue: ['info', 'Entregue'], corrigida: ['success', 'Corrigida'] };
const AS_MAX = 20 * 1024 * 1024;
/** Envio de trabalho pelo portal do aluno: escolhe o professor, vê as atividades dele, abre uma e envia arquivo, título e descrição. Turma e turno vêm do cadastro. */
export function AssignmentSubmit({ student = {}, teachers = [], assignments: a0 = [], defaultTeacher = '', defaultAssignment = null, onSubmit }) {
  const toast = useToast();
  const [list, setList] = useState(a0);
  const [teacher, setTeacher] = useState(typeof defaultTeacher === 'string' && teachers.some((t) => t.id === defaultTeacher) ? defaultTeacher : '');
  const [sel, setSel] = useState(typeof defaultAssignment === 'string' ? defaultAssignment : null);
  const [filter, setFilter] = useState([]);
  const blank = { title: '', desc: '', files: [], link: '', note: '', mine: false };
  const [form, setForm] = useState(blank);
  const [again, setAgain] = useState(false); const [confirm, setConfirm] = useState(false); const [sending, setSending] = useState(false);
  const tch = teachers.find((x) => x.id === teacher);
  const ofTeacher = list.filter((a) => a.teacher === teacher);
  const shown = ofTeacher.filter((a) => !filter.length || (filter[0] === 'abertas' ? a.status === 'aberta' || a.status === 'refazer' : a.status === 'entregue' || a.status === 'corrigida'));
  const cur = list.find((a) => a.id === sel && a.teacher === teacher);
  const editing = !!cur && (cur.status === 'aberta' || cur.status === 'refazer' || again);
  const dirty = editing && !!(form.title || form.desc || form.files.length || form.link || form.note);
  const okFiles = form.files.filter((f) => !f.error);
  const ready = form.title.trim().length > 2 && (okFiles.length > 0 || form.link.trim().length > 5) && form.mine && !form.files.some((f) => f.error);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const pick = (id) => { setSel(id); setForm(blank); setAgain(false); };
  const addFiles = (fs) => set({ files: [...form.files, ...fs.filter((f) => !form.files.some((x) => x.name === f.name)).map((f) => ({ name: f.name, size: f.size, progress: 100, error: f.size > AS_MAX ? 'Arquivo acima de 20 MB. Envie um menor ou cole um link.' : undefined }))] });
  const send = () => {
    setSending(true);
    setTimeout(() => {
      const at = intgHora(); const prot = `TR-${String(cur.id).toUpperCase()}-${at.replace('h', '')}`;
      const sent = { title: form.title.trim(), desc: form.desc.trim(), files: okFiles.map((f) => f.name), link: form.link.trim(), note: form.note.trim(), at: `hoje, ${at}`, prot };
      setList((l) => l.map((a) => (a.id === cur.id ? { ...a, status: 'entregue', sent, grade: undefined, feedback: undefined } : a)));
      setSending(false); setConfirm(false); setForm(blank); setAgain(false);
      toast.show({ tone: 'success', title: 'Trabalho enviado', message: `Protocolo ${prot}. ${tch ? tch.name : 'O professor'} já vê a entrega.` });
      onSubmit && onSubmit({ assignment: cur.id, ...sent });
    }, 900);
  };
  const leave = useUnsaved(dirty, { title: 'Sair sem enviar o trabalho?', children: 'O trabalho ainda não foi enviado. Se você sair agora, o título, a descrição e os arquivos escolhidos são perdidos.' });
  const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  return (
    <div className="rc-card rc-submit">
      <ol className="rc-submit-steps">
        <li className={cx('rc-submit-step', teacher && 'is-done')}>
          <header><span className="rc-submit-n">{teacher ? <Icon name="check" size={16} /> : 1}</span><div><h3 className="rc-title-sm">Para qual professor</h3><p className="rc-muted">Turma e turno vêm do seu cadastro.</p></div></header>
          <div className="rc-submit-grid">
            <Select label="Professor" placeholder="Escolha o professor" value={teacher} onChange={(e) => { setTeacher(e.target.value); pick(null); setFilter([]); }} options={teachers.map((t) => ({ value: t.id, label: `${t.name} · ${t.subject}` }))} />
            <div className="rc-submit-lock"><span className="rc-field-label">Turma</span><p><Icon name="lock" size={14} />{student.klass}</p></div>
            <div className="rc-submit-lock"><span className="rc-field-label">Turno</span><p><Icon name="lock" size={14} />{student.shift}</p></div>
          </div>
        </li>
        <li className={cx('rc-submit-step', cur && 'is-done', !teacher && 'is-off')}>
          <header><span className="rc-submit-n">{cur ? <Icon name="check" size={16} /> : 2}</span><div><h3 className="rc-title-sm">{tch ? `Atividades de ${tch.name}` : 'Atividades do professor'}</h3><p className="rc-muted">{teacher ? `${ofTeacher.filter((a) => a.status === 'aberta' || a.status === 'refazer').length} para entregar em ${tch.subject}. Toque na atividade para abrir.` : 'Escolha o professor para ver o que ele passou para a sua turma.'}</p></div></header>
          {teacher && <>
            <FilterChips single label="Mostrar" value={filter} onChange={setFilter} options={[{ value: 'abertas', label: 'Para entregar' }, { value: 'feitas', label: 'Já enviadas' }]} />
            <ul className="rc-submit-list">
              {shown.map((a) => { const [tone, lbl] = AS_ST[a.status]; return (
                <li key={a.id}><button type="button" className={cx('rc-submit-item', sel === a.id && 'is-on')} aria-pressed={sel === a.id} onClick={() => pick(a.id)}>
                  <span className="rc-submit-ico"><Icon name={a.icon || 'clipboard'} size={18} /></span>
                  <span className="rc-submit-txt"><strong>{a.title}</strong><small>{a.dueLabel} · {a.points}</small></span>
                  <StatusPill size="sm" tone={tone}>{a.status === 'corrigida' && a.grade ? `Nota ${a.grade}` : lbl}</StatusPill>
                  <Icon name="chevron-right" size={16} className="rc-submit-go" />
                </button></li>
              ); })}
            </ul>
            {shown.length === 0 && (ofTeacher.length === 0
              ? <EmptyState compact title="Nenhuma atividade deste professor">Quando o professor publicar uma atividade para a sua turma, ela aparece aqui.</EmptyState>
              : <EmptyState compact title="Nenhuma atividade neste filtro">Este professor não tem atividade assim para a sua turma.</EmptyState>)}
          </>}
        </li>
        <li className={cx('rc-submit-step', !cur && 'is-off')}>
          <header><span className="rc-submit-n">3</span><div><h3 className="rc-title-sm">{cur ? cur.title : 'Sua entrega'}</h3><p className="rc-muted">{cur ? `${cur.dueLabel} · ${cur.points}` : 'Abra uma atividade para enviar o arquivo, o título e a descrição.'}</p></div></header>
          {cur && <>
            <div className="rc-submit-brief"><p>{cur.desc}</p>{cur.attach && <a className="rc-btn rc-btn-ghost rc-btn-sm" href="#" onClick={(e) => { e.preventDefault(); toast.show({ tone: 'neutral', title: 'Arquivo baixado', message: cur.attach }); }}><Icon name="paperclip" size={16} />{cur.attach}</a>}</div>
            {cur.status === 'refazer' && !again && cur.feedback && <p className="rc-submit-back"><Icon name="alert" size={16} /><span><strong>O professor pediu para refazer.</strong> {cur.feedback}</span></p>}
            {editing ? (
              <div className="rc-submit-form">
                <TextField label="Título do trabalho" required placeholder="Ex.: Lista 8, Ana Beatriz" maxLength={80} value={form.title} onChange={(e) => set({ title: e.target.value })} />
                <TextArea label="Descrição" optional rows={3} placeholder="Conte o que você fez, em poucas linhas." maxLength={600} value={form.desc} onChange={(e) => set({ desc: e.target.value })} />
                <FileDrop label="Arraste o arquivo do trabalho ou escolha no aparelho" hint="PDF, Word, slides ou foto do caderno. Até 20 MB por arquivo." accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg" files={form.files.map((f) => ({ ...f, size: kb(f.size) }))} onFiles={addFiles} onRemove={(f) => set({ files: form.files.filter((x) => x.name !== f.name) })} />
                <TextField label="Link do trabalho" optional icon="external" placeholder="Cole o link do Drive, do Canva ou do vídeo" value={form.link} onChange={(e) => set({ link: e.target.value })} />
                <TextField label="Recado para o professor" optional placeholder="Ex.: fiz a questão 7 de dois jeitos" value={form.note} onChange={(e) => set({ note: e.target.value })} />
                <Checkbox label="Este trabalho é meu" description="Fiz sozinho ou com o grupo combinado. Se usei alguma fonte, citei no trabalho." checked={form.mine} onChange={(v) => set({ mine: typeof v === 'boolean' ? v : !!(v && v.target && v.target.checked) })} />
                <div className={cx('rc-savebar', dirty && 'is-dirty')} role="group" aria-label="Enviar trabalho">
                  <p className="rc-savebar-status" aria-live="polite"><Icon name={ready ? 'check' : 'info'} size={16} /><span>{ready ? 'Tudo pronto para enviar.' : 'Falta: ' + [form.title.trim().length > 2 ? null : 'título', okFiles.length || form.link.trim().length > 5 ? null : 'arquivo ou link', form.mine ? null : 'marcar que o trabalho é seu'].filter(Boolean).join(', ') + '.'}</span></p>
                  <Button variant="ghost" disabled={!dirty} onClick={() => { setForm(blank); setAgain(false); }}>Limpar</Button>
                  <Button variant="primary" icon="send" disabled={!ready} onClick={() => setConfirm(true)}>Enviar trabalho</Button>
                </div>
              </div>
            ) : (
              <div className="rc-submit-done">
                <dl className="rc-submit-dl">
                  <div><dt>Título</dt><dd>{cur.sent.title}</dd></div>
                  <div><dt>Enviado</dt><dd>{cur.sent.at}</dd></div>
                  <div><dt>Arquivos</dt><dd>{(cur.sent.files || []).join(', ') || cur.sent.link}</dd></div>
                  <div><dt>Protocolo</dt><dd>{cur.sent.prot}</dd></div>
                  {cur.sent.desc && <div className="is-wide"><dt>Descrição</dt><dd>{cur.sent.desc}</dd></div>}
                </dl>
                {cur.status === 'corrigida'
                  ? <p className="rc-submit-grade"><strong>Nota {cur.grade}</strong><span>{cur.feedback}</span></p>
                  : <p className="rc-submit-wait"><Icon name="clock" size={16} />Esperando a correção de {tch ? tch.name : 'o professor'}. A nota aparece aqui e em Notas.</p>}
                {cur.status === 'entregue' && !cur.closed && <div><Button variant="secondary" icon="refresh" onClick={() => { setAgain(true); setForm({ ...blank, title: cur.sent.title, desc: cur.sent.desc || '' }); }}>Enviar de novo até o prazo</Button></div>}
              </div>
            )}
          </>}
        </li>
      </ol>
      <Dialog open={confirm} onClose={() => !sending && setConfirm(false)} title="Enviar o trabalho agora?" description={cur ? `${cur.title} · ${tch ? tch.name : ''}` : ''} icon="send" size="sm"
        footer={<><Button variant="ghost" disabled={sending} onClick={() => setConfirm(false)}>Revisar</Button><Button variant="primary" loading={sending} loadingLabel="Enviando" onClick={send}>Enviar</Button></>}>
        {again ? 'A entrega nova fica no lugar da anterior. O professor vê só a última.' : 'O professor recebe na hora. Você pode enviar de novo até o prazo, se precisar corrigir algo.'}
      </Dialog>
      {leave.dialog}
    </div>
  );
}

/* =========================================================
   Linha do tempo do aluno
   ========================================================= */

const TL = { nota: ['roxo', 'chart', 'Notas'], falta: ['vermelho', 'x-circle', 'Faltas'], ocorrencia: ['laranja', 'alert', 'Ocorrências'], atendimento: ['ciano', 'users', 'Atendimentos'], elogio: ['verde', 'star', 'Elogios'], saude: ['rosa', 'heart', 'Saúde'], matricula: ['azul', 'graduation', 'Matrícula'], financeiro: ['verde', 'wallet', 'Financeiro'] };
/** Linha do tempo do aluno: notas, faltas, ocorrências, atendimentos e marcos, filtráveis por tipo e agrupados por mês. */
export function StudentTimeline({ events = [] }) {
  const kinds = [...new Set(events.map((e) => e.kind))];
  const [f, setF] = useState([]);
  const list = f.length ? events.filter((e) => f.includes(e.kind)) : events;
  const months = list.reduce((acc, e) => { (acc[e.month] = acc[e.month] || []).push(e); return acc; }, {});
  return (
    <div className="rc-stl">
      <FilterChips label="Tipos de registro" value={f} onChange={setF} options={kinds.map((k) => ({ value: k, label: TL[k][2], count: events.filter((e) => e.kind === k).length }))} />
      {Object.entries(months).map(([m, es]) => (
        <section key={m} className="rc-stl-month">
          <h4 className="rc-stl-mlabel">{m}</h4>
          <ol>
            {es.map((e, i) => { const [c, ic, l] = TL[e.kind] || TL.nota; return (
              <li key={`${e.date}${e.title}`} className={cx('rc-stl-item', `rc-c-${c}`)} style={{ '--i': i }}>
                <span className="rc-stl-node"><Icon name={ic} size={16} /></span>
                <div className="rc-stl-card"><p className="rc-stl-top"><span className="rc-stl-kind">{l.replace(/s$/, '')}</span><time>{e.date}</time></p><p className="rc-stl-title">{e.title}</p>{e.meta && <p className="rc-muted">{e.meta}</p>}</div>
              </li>
            ); })}
          </ol>
        </section>
      ))}
    </div>
  );
}

/* =========================================================
   Grupos e permissões
   ========================================================= */

const ACTIONS = [['ver', 'Ver'], ['criar', 'Criar'], ['editar', 'Editar'], ['excluir', 'Excluir'], ['aprovar', 'Aprovar'], ['exportar', 'Exportar']];
const SCOPES = [['escola', 'Toda a rede'], ['sede', 'Sua sede'], ['segmento', 'Seu segmento'], ['turmas', 'Suas turmas'], ['proprio', 'Só o que criou']];
const RESTRICTIONS = [
  { id: 'horario', label: 'Só no horário de trabalho', hint: 'Segunda a sexta, das 6h às 19h. Fora disso, o acesso fica bloqueado.' },
  { id: 'rede', label: 'Só na rede da escola', hint: 'Bloqueia o acesso de fora do wi-fi e da rede interna.' },
  { id: '2fa', label: 'Verificação em duas etapas', hint: 'Pede um código no celular a cada novo aparelho.' },
  { id: 'celular', label: 'Permitir acesso pelo celular', hint: 'App e navegador do celular.' },
  { id: 'mask', label: 'Mascarar CPF, RG e telefone', hint: 'Mostra só os últimos dígitos.' },
  { id: 'saude', label: 'Ocultar dados de saúde', hint: 'Alergias e medicação ficam só com quem cuida do aluno.' },
  { id: 'valores', label: 'Ocultar valores financeiros', hint: 'Vê a situação, em dia ou em aberto, sem os valores.' },
  { id: 'lote', label: 'Bloquear exportação e impressão em lote', hint: 'Só exporta um registro por vez.' },
  { id: 'validade', label: 'Acesso com validade', hint: 'Expira no fim do ano letivo. A direção renova.' }];
const memberOf = (m) => (typeof m === 'string' ? { name: m } : m);
/** Grupos de funcionários e o que cada grupo pode fazer: ações por módulo, alcance, regras específicas, pessoas, restrições e prévia do menu. */
export function PermissionMatrix({ groups = [], modules = [], value = {}, scopes = {}, rules = {}, restrictions = {}, restrictionOptions = RESTRICTIONS, onSave, defaultGroup, defaultTab = 'modulos', defaultOpen }) {
  const [gs, setGs] = useState(groups);
  const [g, setG] = useState(defaultGroup || (groups[0] && groups[0].id));
  const [perm, setPerm] = useState(value);
  const [scope, setScope] = useState(scopes);
  const [rule, setRule] = useState(rules);
  const [restr, setRestr] = useState(restrictions);
  const [tab, setTab] = useState(defaultTab);
  const [openRow, setOpenRow] = useState(defaultOpen || null);
  const [dirty, setDirty] = useState(0); const toast = useToast();
  const leave = useUnsaved(dirty > 0, { children: 'As permissões alteradas ainda não foram salvas. Se você sair agora, os grupos continuam como estavam.' });
  const [saving, setSaving] = useState(false);
  const [dlg, setDlg] = useState(null);
  const [novo, setNovo] = useState({ name: '', base: [] });
  const [pessoa, setPessoa] = useState('');
  const touch = () => setDirty((d) => d + 1);
  const cur = perm[g] || {};
  const group = gs.find((x) => x.id === g) || {};
  const members = (group.members || []).map(memberOf);
  const scopeOf = (m) => (scope[g] || {})[m.id] || (m.scopes && m.scopes[0]) || 'sede';
  const rulesOf = (m) => new Set((rule[g] || {})[m.id] || []);
  const set = (mod, act) => {
    setPerm((p) => { const gm = { ...(p[g] || {}) }; const s = new Set(gm[mod] || []); if (s.has(act)) { s.delete(act); if (act === 'ver') s.clear(); } else { s.add(act); s.add('ver'); } gm[mod] = [...s]; return { ...p, [g]: gm }; });
    touch();
  };
  const all = (mod) => { setPerm((p) => { const gm = { ...(p[g] || {}) }; gm[mod] = (gm[mod] || []).length === ACTIONS.length ? [] : ACTIONS.map((a) => a[0]); return { ...p, [g]: gm }; }); touch(); };
  const pickScope = (mod, v) => { if (!v) return; setScope((o) => ({ ...o, [g]: { ...(o[g] || {}), [mod]: v } })); touch(); };
  const toggleRule = (mod, id) => { setRule((o) => { const gm = { ...(o[g] || {}) }; const s = new Set(gm[mod] || []); s.has(id) ? s.delete(id) : s.add(id); gm[mod] = [...s]; return { ...o, [g]: gm }; }); touch(); };
  const toggleRestr = (id) => { setRestr((o) => { const s = new Set(o[g] || []); s.has(id) ? s.delete(id) : s.add(id); return { ...o, [g]: [...s] }; }); touch(); };
  const setMembers = (fn) => { setGs((l) => l.map((x) => (x.id === g ? { ...x, members: fn(x.members || []) } : x))); touch(); };
  const addPessoa = () => { const n = pessoa.trim(); if (!n || members.some((m) => m.name.toLowerCase() === n.toLowerCase())) return; setMembers((l) => [...l, { name: n, role: 'Adicionado agora' }]); setPessoa(''); };
  const criar = () => {
    const name = novo.name.trim(); if (!name || gs.some((x) => x.name.toLowerCase() === name.toLowerCase())) return;
    const id = 'g' + Date.now(); const base = novo.base[0];
    setGs((l) => [...l, { id, name, icon: 'users', color: 'ciano', description: base ? `Criado a partir de ${(gs.find((x) => x.id === base) || {}).name}.` : 'Grupo novo, sem permissões ainda.', members: [] }]);
    if (base) { setPerm((p) => ({ ...p, [id]: JSON.parse(JSON.stringify(p[base] || {})) })); setScope((p) => ({ ...p, [id]: { ...(p[base] || {}) } })); setRule((p) => ({ ...p, [id]: JSON.parse(JSON.stringify(p[base] || {})) })); setRestr((p) => ({ ...p, [id]: [...(p[base] || [])] })); }
    setG(id); setTab('modulos'); setDlg(null); setNovo({ name: '', base: [] }); touch();
  };
  const nomeRepetido = novo.name.trim() && gs.some((x) => x.name.toLowerCase() === novo.name.trim().toLowerCase());
  const visiveis = modules.filter((m) => (cur[m.id] || []).includes('ver'));
  const nAcoes = modules.reduce((a, m) => a + (cur[m.id] || []).length, 0);
  const nRegras = visiveis.reduce((a, m) => a + rulesOf(m).size, 0);
  const sections = modules.reduce((a, m) => { const k = m.section || 'Módulos'; (a.find((x) => x[0] === k) || a[a.push([k, []]) - 1])[1].push(m); return a; }, []);
  const scopeLabel = (id) => (SCOPES.find((x) => x[0] === id) || [])[1];
  const reset = () => { setGs(groups); setPerm(value); setScope(scopes); setRule(rules); setRestr(restrictions); setDirty(0); if (!groups.some((x) => x.id === g)) setG(defaultGroup || (groups[0] && groups[0].id)); };
  return (
    <div className="rc-card rc-perm">
      <aside className="rc-perm-groups" aria-label="Grupos">
        <p className="rc-overline">Grupos</p>
        {gs.map((x) => (
          <button key={x.id} type="button" className={cx('rc-perm-group', `rc-c-${x.color || 'azul'}`, g === x.id && 'is-on')} aria-pressed={g === x.id} onClick={() => { setG(x.id); setOpenRow(null); }}>
            <span className="rc-perm-gico"><Icon name={x.icon || 'users'} size={18} /></span>
            <span className="rc-perm-gname">{x.name}<small>{(x.members || []).length} {(x.members || []).length === 1 ? 'pessoa' : 'pessoas'}</small></span>
          </button>
        ))}
        <Button size="sm" variant="ghost" icon="plus" onClick={() => { setNovo({ name: '', base: [] }); setDlg('novo'); }}>Novo grupo</Button>
      </aside>
      <div className="rc-perm-main">
        <div className="rc-perm-top">
          <div style={{ minWidth: 0 }}><h3 className="rc-title-md">{group.name}</h3><p className="rc-muted">{group.description}</p></div>
          <div className="rc-perm-topactions">
            <span className="rc-perm-members">{members.slice(0, 4).map((m) => <Avatar key={m.name} name={m.name} size={30} />)}{members.length > 4 && <span className="rc-avatar rc-avatar-more" style={{ width: 30, height: 30 }}>+{members.length - 4}</span>}</span>
            <Button size="sm" variant="ghost" icon="copy" onClick={() => { setNovo({ name: `${group.name} (cópia)`, base: [g] }); setDlg('novo'); }}>Duplicar</Button>
          </div>
        </div>
        <div className="rc-perm-bar">
          <SegmentedControl label="Seção do grupo" value={tab} onChange={setTab} options={[{ value: 'modulos', label: 'Módulos e ações' }, { value: 'pessoas', label: `Pessoas · ${members.length}` }, { value: 'restricoes', label: `Restrições · ${(restr[g] || []).length}` }, { value: 'previa', label: 'Ver como' }]} />
          <p className="rc-perm-sum" aria-live="polite">{visiveis.length} de {modules.length} módulos · {nAcoes} ações · {nRegras} regras específicas</p>
        </div>
        {tab === 'modulos' && (
          <div className="rc-table-wrap">
            <table className="rc-table rc-perm-table">
              <thead><tr><th>Módulo e alcance</th>{ACTIONS.map(([k, l]) => <th key={k} className="rc-perm-c">{l}</th>)}<th className="rc-perm-c">Tudo</th><th className="rc-perm-x"><span className="rc-sr">Regras</span></th></tr></thead>
              <tbody>{sections.map(([sec, mods]) => (
                <React.Fragment key={sec}>
                  <tr className="rc-perm-sec"><th colSpan={ACTIONS.length + 3} scope="colgroup">{sec}</th></tr>
                  {mods.map((m) => { const acts = new Set(cur[m.id] || []); const full = acts.size === ACTIONS.length; const on = acts.has('ver'); const rs = rulesOf(m); const open = openRow === m.id; const sc = m.scopes || SCOPES.map((x) => x[0]); return (
                    <React.Fragment key={m.id}>
                      <tr className={cx(!on && 'is-off', open && 'is-open')}>
                        <td><span className={cx('rc-perm-mod', `rc-c-${m.color || 'azul'}`)}><span className="rc-perm-mico"><Icon name={m.icon} size={16} /></span><span className="rc-perm-modtext">{m.name}<small>{on ? `${scopeLabel(scopeOf(m))}${m.rules ? ` · ${rs.size} de ${m.rules.length} regras` : ''}` : 'Sem acesso'}</small></span></span></td>
                        {ACTIONS.map(([k, l]) => (
                          <td key={k} className="rc-perm-c"><button type="button" className={cx('rc-perm-toggle', acts.has(k) && 'is-on')} aria-pressed={acts.has(k)} aria-label={`${l} em ${m.name}`} onClick={() => set(m.id, k)}><Icon name="check" size={14} strokeWidth={2.75} /></button></td>
                        ))}
                        <td className="rc-perm-c"><Switch checked={full} onChange={() => all(m.id)} label={<span className="rc-sr">Tudo em {m.name}</span>} /></td>
                        <td className="rc-perm-x"><IconButton icon={open ? 'chevron-up' : 'chevron-down'} label={`${open ? 'Fechar' : 'Abrir'} alcance e regras de ${m.name}`} aria-expanded={open} disabled={!on} onClick={() => setOpenRow(open ? null : m.id)} /></td>
                      </tr>
                      {open && on && (
                        <tr className="rc-perm-detail"><td colSpan={ACTIONS.length + 3}>
                          <div className="rc-perm-detailgrid">
                            <div>
                              <p className="rc-overline">Alcance: o que o grupo enxerga em {m.name}</p>
                              <FilterChips single label={`Alcance em ${m.name}`} value={[scopeOf(m)]} onChange={(v) => pickScope(m.id, v[0])} options={SCOPES.filter((x) => sc.includes(x[0])).map(([v, l]) => ({ value: v, label: l }))} />
                            </div>
                            {m.rules && (
                              <div>
                                <p className="rc-overline">Regras específicas</p>
                                <div className="rc-perm-rules">{m.rules.map((r) => <Switch key={r.id} size="sm" checked={rs.has(r.id)} onChange={() => toggleRule(m.id, r.id)} label={r.label} description={r.hint} />)}</div>
                              </div>
                            )}
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ); })}
                </React.Fragment>
              ))}</tbody>
            </table>
          </div>
        )}
        {tab === 'pessoas' && (
          <div className="rc-perm-pane">
            <div className="rc-perm-add"><TextField label="Adicionar pessoa ao grupo" placeholder="Nome do profissional" value={pessoa} onChange={(e) => setPessoa(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addPessoa(); }} /><Button icon="plus" disabled={!pessoa.trim()} onClick={addPessoa}>Adicionar</Button></div>
            {members.length === 0 ? <EmptyState compact title="Ninguém neste grupo ainda">Adicione uma pessoa acima, ou escolha o grupo na ficha do profissional.</EmptyState> : (
              <ul className="rc-perm-people">{members.map((m) => (
                <li key={m.name}><Avatar name={m.name} size={36} /><span className="rc-perm-pname">{m.name}<small>{m.role || group.name}</small></span>{m.also && <StatusPill size="sm" tone="neutral">Também em {m.also}</StatusPill>}<Button size="sm" variant="ghost" onClick={() => setMembers((l) => l.filter((x) => memberOf(x).name !== m.name))}>Remover</Button></li>
              ))}</ul>
            )}
            <p className="rc-muted">Uma pessoa pode estar em mais de um grupo. Nesse caso, vale a soma das permissões.</p>
          </div>
        )}
        {tab === 'restricoes' && (
          <div className="rc-perm-pane">
            <div className="rc-perm-restr">{restrictionOptions.map((r) => <Switch key={r.id} checked={(restr[g] || []).includes(r.id)} onChange={() => toggleRestr(r.id)} label={r.label} description={r.hint} />)}</div>
          </div>
        )}
        {tab === 'previa' && (
          <div className="rc-perm-pane">
            <p className="rc-muted">Este é o menu que {group.name} vê ao entrar. Módulo sem a ação Ver não aparece.</p>
            {visiveis.length === 0 ? <EmptyState compact title="Este grupo não vê nenhum módulo">Marque a ação Ver em pelo menos um módulo.</EmptyState> : (
              <div className="rc-perm-preview">{sections.map(([sec, mods]) => { const vis = mods.filter((m) => (cur[m.id] || []).includes('ver')); return vis.length ? (
                <div key={sec} className="rc-perm-pvsec"><p className="rc-overline">{sec}</p>
                  {vis.map((m) => (
                    <div key={m.id} className={cx('rc-perm-pvrow', `rc-c-${m.color || 'azul'}`)}><span className="rc-perm-mico"><Icon name={m.icon} size={16} /></span><span className="rc-perm-pname">{m.name}<small>{scopeLabel(scopeOf(m))}</small></span><span className="rc-perm-pvacts">{ACTIONS.filter(([k]) => k !== 'ver' && (cur[m.id] || []).includes(k)).map(([k, l]) => <StatusPill key={k} size="sm" tone={k === 'excluir' ? 'danger' : k === 'aprovar' ? 'warning' : 'brand'}>{l}</StatusPill>)}{(cur[m.id] || []).length === 1 && <StatusPill size="sm" tone="neutral">Só leitura</StatusPill>}</span></div>
                  ))}
                </div>
              ) : null; })}</div>
            )}
          </div>
        )}
        <div className={cx('rc-perm-save', dirty > 0 && 'is-dirty')}>
          <span>{dirty > 0 ? `${dirty} ${dirty === 1 ? 'alteração' : 'alterações'} sem salvar` : 'Tudo salvo'}</span>
          <Button variant="ghost" disabled={!dirty} onClick={reset}>Desfazer</Button>
          <Button variant="primary" icon="check" disabled={!dirty} loading={saving} loadingLabel="Salvando" onClick={() => { setSaving(true); setTimeout(() => { setSaving(false); setDirty(0); toast.show({ tone: 'success', title: 'Permissões salvas', message: 'Valem no próximo acesso de cada pessoa do grupo.' }); onSave && onSave({ groups: gs, value: perm, scopes: scope, rules: rule, restrictions: restr }); }, 900); }}>Salvar permissões</Button>
        </div>
      </div>
      <Dialog open={dlg === 'novo'} onClose={() => setDlg(null)} title="Criar grupo" description="O grupo novo aparece na lista e na ficha do profissional." icon="users" tone="brand"
        footer={<><Button variant="ghost" onClick={() => setDlg(null)}>Cancelar</Button><Button variant="primary" disabled={!novo.name.trim() || !!nomeRepetido} onClick={criar}>Criar grupo</Button></>}>
        <div style={{ display: 'grid', gap: 16 }}>
          <TextField label="Nome do grupo" placeholder="Ex.: Enfermaria" value={novo.name} error={nomeRepetido ? 'Já existe um grupo com este nome' : undefined} onChange={(e) => setNovo((o) => ({ ...o, name: e.target.value }))} />
          <div style={{ display: 'grid', gap: 8 }}><span className="rc-field-label">Copiar permissões de (opcional)</span><FilterChips single label="Copiar permissões de" value={novo.base} onChange={(v) => setNovo((o) => ({ ...o, base: v }))} options={gs.map((x) => ({ value: x.id, label: x.name }))} /></div>
        </div>
      </Dialog>
      {leave.dialog}
    </div>
  );
}
