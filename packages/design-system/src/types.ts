import type * as React from 'react';
import type { JSX } from 'react';

/* Sistema Recreio · props dos componentes. */
export type Cat = 'azul' | 'verde' | 'amarelo' | 'laranja' | 'vermelho' | 'roxo' | 'ciano' | 'rosa';
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
export type ThemeMode = 'claro' | 'escuro' | 'alto-contraste' | 'alto-contraste-escuro';
export type IconName = string; // ver Recreio.iconNames
/** Opção em texto puro ou objeto. No texto puro os campos do objeto ficam undefined (o código lê `o.value ?? o`). */
export type Opt<T extends object> = T | (string & { [K in keyof T]?: undefined });

/* Variáveis CSS (--x) em style e o evento de troca de marca. */
declare module 'react' {
  interface CSSProperties {
    [variable: `--${string}`]: string | number | undefined;
  }
}
declare global {
  interface WindowEventMap {
    'recreio:marca': CustomEvent<Brand | null>;
  }
}

/* Fundamentos */
export interface IconProps {
  name: IconName;
  size?: number;
  label?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}
export interface LogoMarkProps {
  size?: number;
  className?: string;
  title?: string;
}
export interface LogoProps {
  variant?: 'inline' | 'full';
  size?: number;
  tone?: 'auto' | 'cor' | 'negativo';
  className?: string;
}
export interface SchoolMarkProps {
  name?: string;
  src?: string;
  size?: number;
  className?: string;
}
export interface MadeByProps {
  product?: string;
  className?: string;
}
export interface Preferences {
  textScale: number;
  spacing: 'normal' | 'amplo';
  font: 'padrao' | 'legivel';
  motion: 'sistema' | 'reduzido';
  focus: boolean;
  reading: 'normal' | 'simples';
  theme?: ThemeMode;
}
export type PreferencesPatch = Partial<Preferences> | ((p: Preferences) => Partial<Preferences>);
export interface PreferencesContextValue {
  prefs: Preferences;
  setPrefs: (patch: PreferencesPatch) => void;
}
export interface RecreioProviderProps {
  children: React.ReactNode;
  seed?: string;
  theme?: ThemeMode;
  initialPrefs?: Partial<Preferences>;
  onPrefsChange?: (p: Preferences) => void;
}
export interface SchoolThemeProps {
  seed?: string;
  brand?: Brand | null;
  mode?: ThemeMode;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}
/** Marca salva pela escola (white label). Campos vazios valem o padrão. */
export interface Brand {
  name?: string;
  short?: string;
  slogan?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  navStyle?: string;
  font?: string;
  radius?: string;
  logo?: string;
  logoDark?: string;
  symbol?: string;
  /* dados dos documentos (BrandEditor) */
  legalName?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  site?: string;
  act?: string;
  signer?: string;
  signerRole?: string;
  headerAlign?: string;
  watermark?: boolean;
  footer?: boolean;
  qr?: boolean;
}
export interface PaletteNote {
  token: string;
  from: string;
  to: string;
  reason: string;
}
export interface PaletteCheck {
  pair: string;
  ratio: number;
}
export interface ToastOptions {
  id?: string;
  tone?: Tone;
  title?: string;
  message?: string;
  icon?: IconName;
  duration?: number;
  action?: { label: string; onClick?: () => void };
}
export interface ToastProviderProps {
  children: React.ReactNode;
  max?: number;
}
export interface ToastApi {
  show: (t: ToastOptions) => string | void;
  dismiss: (id: string) => void;
}
export interface PortalProps {
  children: React.ReactNode;
}

/* Ações */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  loadingLabel?: string;
  full?: boolean;
}
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  variant?: 'ghost' | 'secondary' | 'primary';
  size?: 'sm' | 'md';
  badge?: number | string | boolean;
}
export interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  full?: boolean;
  onCopied?: () => void;
}
export interface SegmentedControlProps {
  options: Array<Opt<{ value: string; label: string; icon?: IconName }>>;
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
  label?: string;
  full?: boolean;
}
export interface KbdProps {
  children: React.ReactNode;
}

/* Campos */
export interface FieldBase {
  label?: React.ReactNode;
  hint?: string;
  error?: string;
  success?: string;
  required?: boolean;
  optional?: boolean;
  id?: string;
}
export interface FieldProps extends FieldBase {
  children?: React.ReactNode;
  className?: string;
  counter?: React.ReactNode;
}
export interface TextFieldProps extends FieldBase, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  icon?: IconName;
  suffix?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
export interface TextAreaProps extends FieldBase, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean;
}
export interface SearchFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  shortcut?: string | null;
  onClear?: () => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}
/** O Select é próprio (botão e lista): onChange recebe só { target: { value, name } }. */
export interface SelectProps
  extends FieldBase, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  options?: Array<Opt<{ value: string; label: string; hint?: string }>>;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}
export interface CheckboxProps {
  label?: React.ReactNode;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  id?: string;
  className?: string;
}
export interface RadioGroupProps {
  legend?: string;
  name?: string;
  options: Array<
    Opt<{
      value: string;
      label: string;
      description?: string;
      icon?: IconName;
      meta?: React.ReactNode;
      disabled?: boolean;
    }>
  >;
  value?: string;
  onChange?: (v: string) => void;
  variant?: 'list' | 'cards';
  columns?: number;
}
export interface SwitchProps {
  label?: React.ReactNode;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (on: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
  size?: 'sm' | 'md';
  id?: string;
  className?: string;
}
export interface CodeInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  error?: string;
  label?: string;
  hint?: string;
}
export interface SliderProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => React.ReactNode;
  marks?: number[];
  id?: string;
}
export interface FilterChipsProps {
  options: Array<Opt<{ value: string; label: string; count?: number | string }>>;
  value?: string[];
  onChange: (v: string[]) => void;
  label?: string;
  single?: boolean;
}
export interface FileItem {
  name: string;
  progress?: number;
  size?: string;
  error?: string;
}
export interface FileDropProps {
  label?: string;
  hint?: string;
  accept?: string;
  files?: FileItem[];
  onFiles?: (files: File[]) => void;
  onRemove?: (f: FileItem) => void;
  multiple?: boolean;
}

/* Feedback e carregamento */
export interface BadgeProps {
  children?: React.ReactNode;
  tone?: 'brand' | 'neutral' | 'danger' | 'accent' | Tone;
  dot?: boolean;
  pulse?: boolean;
  label?: string;
  className?: string;
}
export interface StatusPillProps {
  tone?: Tone;
  icon?: IconName;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}
export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
  icon?: IconName;
  className?: string;
}
export interface SpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}
export interface ProgressBarProps {
  hideLabel?: boolean;
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export interface ProgressRingProps {
  value?: number;
  max?: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
}
export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  lines?: number;
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
}
export interface LoadingCardProps {
  label?: string;
  rows?: number;
  avatar?: boolean;
}
export interface EmptyStateProps {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  secondary?: React.ReactNode;
  tone?: 'brand' | 'neutral';
  compact?: boolean;
}
export interface ErrorStateProps {
  title?: string;
  children?: React.ReactNode;
  onRetry?: () => void;
  offline?: boolean;
  details?: string;
}

/* Sobreposições */
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom';
}
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  dismissable?: boolean;
  icon?: IconName;
  tone?: Tone;
}
export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'brand';
  loading?: boolean;
}
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  side?: string;
}
export interface UseUnsavedOptions {
  onSave?: () => void;
  onLeave?: (href: string | null) => void;
  title?: string;
  children?: React.ReactNode;
}
export interface MenuItem {
  label: string;
  icon?: IconName;
  hint?: string;
  tone?: 'danger';
  disabled?: boolean;
  onClick?: () => void;
}
export interface MenuProps {
  items: Array<MenuItem | '-'>;
  trigger?: React.ReactElement;
  align?: 'start' | 'end';
  label?: string;
}
export interface CommandItem {
  id?: string;
  label: string;
  meta?: string;
  icon?: IconName;
  avatar?: boolean;
  shortcut?: string;
}
export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  groups: Array<{ label: string; items: CommandItem[] }>;
  placeholder?: string;
  onSelect?: (item: CommandItem) => void;
}

/* Navegação */
export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  count?: number;
  urgent?: boolean;
}
export interface SideNavUnit {
  id: string;
  label: string;
  meta?: string;
  href?: string;
  current?: boolean;
}
export interface SideNavProps {
  school?: { name: string; unit?: string; logo?: string };
  units?: SideNavUnit[];
  groups?: Array<{ label?: string; items: NavItem[] }>;
  active?: string;
  onNavigate?: (id: string) => void;
  footer?: React.ReactNode | null;
  collapsed?: boolean;
  collapsible?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}
export interface TabBarProps {
  items: NavItem[];
  active?: string;
  onNavigate?: (id: string) => void;
}
export interface TopBarProps {
  title?: string;
  subtitle?: string;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  profile?: React.ReactNode;
  onMenu?: () => void;
  sticky?: boolean;
}
export interface AppShellProps {
  sidenav?: React.ReactNode;
  topbar?: React.ReactNode;
  tabbar?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}
export interface TabsProps {
  tabs: Array<{ id: string; label: string; icon?: IconName; count?: number }>;
  value: string;
  onChange: (id: string) => void;
  label?: string;
  size?: 'md';
}
export interface BreadcrumbsProps {
  items: Array<{ label: string; href?: string }>;
}
export interface PaginationProps {
  page: number;
  pages: number;
  onChange: (p: number) => void;
  total?: number;
  pageSize?: number;
  label?: string;
}
export interface StepperProps {
  steps: Array<{ label: string; hint?: string }>;
  current?: number;
  orientation?: 'horizontal' | 'vertical';
}
export interface ProfileSwitcherProps {
  user: { name: string; photo?: string };
  profiles?: Array<{ id: string; label: string; icon?: IconName; school?: string }>;
  dependents?: Array<{ id: string; name: string; group?: string; photo?: string }>;
  activeProfile?: string;
  activeChild?: string;
  onProfile?: (id: string) => void;
  onChild?: (id: string) => void;
  onLogout?: () => void;
  defaultOpen?: boolean;
}

/* Dados */
export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'none';
  href?: string;
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}
export interface StatCardProps {
  label: string;
  value?: number;
  format?: (v: number) => string;
  delta?: number;
  deltaSuffix?: string;
  deltaLabel?: string;
  goodWhen?: 'up' | 'down';
  trend?: number[];
  icon?: IconName;
  loading?: boolean;
  href?: string;
  hint?: string;
  color?: Cat;
  variant?: 'hero';
}
export interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  status?: 'online' | 'away';
  className?: string;
}
export interface AvatarGroupProps {
  people: Array<{ name: string; photo?: string }>;
  max?: number;
  size?: number;
}
export interface Column<R> {
  key: string;
  label: string;
  sortable?: boolean;
  numeric?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  render?: (row: R) => React.ReactNode;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cada tela passa linhas de formato próprio; o padrão aceita qualquer objeto.
export interface DataTableProps<R = any> {
  columns: Column<R>[];
  rows: R[];
  rowKey?: string;
  selectable?: boolean;
  selected?: Array<string | number>;
  onSelect?: (keys: Array<string | number>) => void;
  sort?: { key: string; dir: 'asc' | 'desc' };
  onSort?: (s: { key: string; dir: 'asc' | 'desc' }) => void;
  density?: 'compact' | 'normal' | 'comfortable';
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (row: R) => void;
  caption?: string;
  stickyHeader?: boolean;
}
export interface ListProps {
  children: React.ReactNode;
  divided?: boolean;
  label?: string;
  className?: string;
}
export interface ListItemProps {
  leading?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  unread?: boolean;
  index?: number;
  className?: string;
}
export interface TimelineItem {
  id?: string;
  time: string;
  kind?:
    | 'aula'
    | 'tarefa'
    | 'comunicado'
    | 'pagamento'
    | 'foto'
    | 'refeicao'
    | 'sono'
    | 'evento'
    | 'saida'
    | 'nota'
    | 'mensagem';
  icon?: IconName;
  title: string;
  meta?: string;
  tone?: Tone | 'accent';
  done?: boolean;
  children?: React.ReactNode;
}
export interface TimelineProps {
  items: TimelineItem[];
  nowIndex?: number;
}
export interface DescriptionListProps {
  items: Array<{ label: string; value?: React.ReactNode }>;
  columns?: number;
}
export interface AccordionProps {
  items: Array<{ id: string; title: string; meta?: string; content: React.ReactNode; open?: boolean }>;
  multiple?: boolean;
}
export interface MiniCalendarProps {
  year: number;
  month: number;
  today?: number;
  selected?: number;
  events?: Record<number, Array<Tone | 'accent'>>;
  onSelect?: (day: number) => void;
  onMonth?: (delta: -1 | 1) => void;
}
export interface BarChartProps {
  data: Array<{ label: string; value: number; tone?: 'danger' | 'warning'; highlight?: boolean }>;
  height?: number;
  format?: (v: number) => string;
  reference?: number;
  referenceLabel?: string;
  label?: string;
  highlight?: string;
}
export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  tone?: 'brand' | 'success' | 'danger';
  label?: string;
}

/* Escolar */
export interface PendingItemProps {
  kind?: 'pagamento' | 'assinatura' | 'autorizacao' | 'enquete' | 'leitura' | 'documento' | 'reuniao';
  title: string;
  child?: string;
  due?: string;
  dueTone?: Tone;
  amount?: number;
  actionLabel?: string;
  onAction?: () => void;
  done?: boolean;
  index?: number;
}
export interface AnnouncementCardProps {
  title: string;
  from: string;
  date: string;
  priority?: 'urgente' | 'importante' | 'rotina';
  summary?: string;
  children?: React.ReactNode;
  read?: boolean;
  requireConfirm?: boolean;
  onConfirm?: () => void;
  attachments?: Array<{ name: string; size?: string; href?: string }>;
  libras?: boolean;
  expanded?: boolean;
  image?: { src: string; alt: string };
}
export interface InvoiceCardProps {
  competence: string;
  description?: string;
  amount: number;
  due: string;
  status?: 'aberta' | 'avencer' | 'vencida' | 'paga' | 'compensando' | 'negociada';
  child?: string;
  fine?: number;
  discount?: number;
  onPay?: (method: 'pix' | 'boleto' | 'cartao') => void;
  onReceipt?: () => void;
  compact?: boolean;
}
export interface PixPaymentProps {
  amount: number;
  code?: string;
  expiresIn?: number;
  status?: 'aguardando' | 'pago';
  payee?: string;
  reference?: string;
  onDone?: () => void;
}
export interface ReportCardProps {
  term?: string;
  min?: number;
  subjects: Array<{ name: string; teacher?: string; grade?: number | null; delta?: number; attendance?: number }>;
}
export interface SaveGuardProps {
  children: React.ReactNode;
  label?: string;
  savingLabel?: string;
  savedTitle?: string;
  savedMessage?: string;
  hint?: string;
  sticky?: boolean;
  savedAt?: string;
  defaultDirty?: number;
  onSave?: () => void;
  onDiscard?: () => void;
  className?: string;
}
export interface IntegralStudent {
  id: string | number;
  name: string;
  klass: string;
  shift?: string;
  group: string;
  programs: Array<'integral' | 'semi' | 'reforco'>;
  exit: string;
  pickups?: string[];
  alert?: string;
  workshop?: string;
  reforco?: { group: string; level: number; max?: number; note?: string };
  week?: Array<{ day: string; text: string; today?: boolean }>;
  log?: Record<string, IntegralLogEntry>;
  note?: string;
}
/** Lançamento de uma atividade do integral para um aluno. */
export interface IntegralLogEntry {
  v?: string;
  note?: string;
  subject?: string;
  pickup?: string;
  at?: string;
  by?: string;
}
/** Atividade da rotina do integral. options: [valor, rótulo, tom]. */
export interface IntegralActivity {
  id: string;
  time: string;
  title: string;
  icon: IconName;
  program: 'integral' | 'reforco';
  only?: 'integral' | 'semi' | 'reforco';
  col?: boolean;
  subject?: boolean;
  options: Array<[string, string, Tone]>;
}
export interface IntegralBoardProps {
  students?: IntegralStudent[];
  activities?: IntegralActivity[];
  scope?: 'meus' | 'todos';
  groups?: Array<{ value: string; label: string }>;
  by?: string;
  date?: string;
  defaultSelected?: string | number | null;
  familyHref?: string;
  recordHref?: string;
  subjects?: string[];
  onSave?: (data: { logs: Record<string, unknown>; notes: Record<string, string> }) => void;
}
export interface RoutineBlock {
  id: string;
  time: string;
  end?: string;
  title: string;
  program: 'integral' | 'reforco';
  days: number[];
  who: string;
}
export interface RoutineEditorProps {
  blocks: RoutineBlock[];
  people?: string[];
  group?: string;
  onSave?: (blocks: RoutineBlock[]) => void;
}
export interface AssignmentTeacher {
  id: string;
  name: string;
  subject: string;
}
export interface AssignmentSent {
  title: string;
  desc?: string;
  files?: string[];
  link?: string;
  note?: string;
  at: string;
  prot: string;
}
export interface Assignment {
  id: string;
  teacher: string;
  title: string;
  dueLabel: string;
  points?: string;
  status: 'aberta' | 'refazer' | 'entregue' | 'corrigida';
  icon?: IconName;
  desc?: string;
  attach?: string;
  closed?: boolean;
  sent?: AssignmentSent;
  grade?: string;
  feedback?: string;
}
export interface AssignmentSubmitProps {
  student: { name?: string; klass: string; shift: string };
  teachers: AssignmentTeacher[];
  assignments: Assignment[];
  defaultTeacher?: string;
  defaultAssignment?: string | null;
  onSubmit?: (entrega: AssignmentSent & { assignment: string }) => void;
}
export interface GradeEntryProps {
  students: Array<{ id: string; name: string }>;
  assessments: Array<{ id: string; label: string; weight?: number }>;
  values?: Record<string, string>;
  max?: number;
  onChange?: (values: Record<string, string>) => void;
  onSave?: (values: Record<string, string>) => void;
  saving?: boolean;
  absences?: boolean;
  maxAbsences?: number;
}
export type AttendanceStatus = 'P' | 'F' | 'A';
export interface AttendanceRosterProps {
  students?: Array<{ id: string; name: string; photo?: string; note?: string }>;
  value?: Record<string, AttendanceStatus>;
  onChange?: (v: Record<string, AttendanceStatus>) => void;
  onSave?: (v: Record<string, AttendanceStatus>) => void;
  date?: string;
  lesson?: string;
  offline?: boolean;
  savedAt?: string;
}
export interface ThreadMessage {
  id?: string | number;
  from: string;
  author?: string;
  text: string;
  file?: string;
  time: string;
  status?: 'enviada' | 'lida';
}
export interface MessageThreadProps {
  subject: string;
  participants?: string;
  sla?: string;
  messages?: ThreadMessage[];
  me?: string;
  onSend?: (m: ThreadMessage) => void;
  typing?: string;
}
export interface NotificationItemProps {
  icon?: IconName;
  title: string;
  text?: string;
  time: string;
  unread?: boolean;
  priority?: 'urgente' | 'importante' | 'rotina';
  onClick?: () => void;
  index?: number;
}
export interface StudentHeaderProps {
  name: string;
  photo?: string;
  group: string;
  enrollment: string;
  guardians?: string[];
  tags?: Array<{ label: string; tone?: Tone; icon?: IconName }>;
  actions?: React.ReactNode;
}
export interface DailyLogProps {
  child?: { name: string; group?: string; photo?: string };
  entries?: Record<string, string | undefined>;
  onChange?: (v: Record<string, string | undefined>) => void;
  photos?: number;
}
export interface ModuleCardProps {
  icon: IconName;
  name: string;
  description: string;
  enabled?: boolean;
  onToggle?: (on: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
  requires?: string[];
  segments?: string[];
  plan?: string;
  locked?: boolean;
  color?: Cat;
}
export interface BrandPreviewProps {
  name?: string;
  seed: string;
  logo?: string;
  mode?: ThemeMode;
}
export interface PreferencesPanelProps {
  compact?: boolean;
  onSave?: (p: Preferences & { libras: boolean; ouvir: boolean; traduzir: boolean }) => void;
}
export interface BrandEditorProps {
  defaults?: Brand;
  onSave?: (b: Required<Brand>) => void;
}
export interface ClassOption {
  id: string;
  name: string;
  shift: string;
  segment?: string;
  families?: number;
}
export interface ClassPickerProps {
  classes?: ClassOption[];
  value?: string[];
  scope?: 'minhas' | 'todas';
  label?: string;
  onChange?: (ids: string[]) => void;
  max?: number;
}
export interface GradeListProps {
  students?: Array<{ id: string; name: string; note?: string }>;
  values?: Record<string, string | number>;
  max?: number;
  step?: number;
  assessment?: string;
  onSave?: (values: Record<string, string | number>) => void;
}
export interface LoginLayoutProps {
  school?: { name: string; unit?: string; logo?: string };
  children: React.ReactNode;
  slides?: Array<{ kicker: string; title: string; text: string; art?: 'today' | 'pix' | 'roster' | 'gate' | 'kpi' }>;
  product?: string;
  showcase?: boolean;
}

/* Módulos */
export interface AnnouncementComposerProps {
  audiences: Array<{ id: string; label: string; count: number }>;
  defaultAudience?: string[];
  onSend?: (d: object) => void;
  onSchedule?: (d: object) => void;
}
export interface ReadReceiptsProps {
  title?: string;
  total: number;
  read: number;
  confirmed: number;
  pending?: Array<{ name: string; child?: string; group?: string }>;
  onRemind?: (pending: object[]) => void;
}
export interface ConversationListProps {
  conversations: Array<{
    id: string;
    name: string;
    kind?: 'professor' | 'coordenacao' | 'secretaria' | 'integral';
    role?: string;
    child?: string;
    last: string;
    time: string;
    unread?: number;
    online?: boolean;
    typing?: boolean;
  }>;
  active?: string;
  onSelect?: (id: string) => void;
  filters?: string[];
}
export interface BoletoCardProps {
  competence: string;
  child?: string;
  amount: number;
  due: string;
  line: string;
  status?: 'aberto' | 'vencido' | 'pago' | 'registrando';
  payee?: string;
  fineNote?: string;
  onDownload?: () => void;
  onSecondCopy?: () => void;
  onPix?: () => void;
}
export interface TaxReceiptProps {
  year?: number;
  school: { name: string; cnpj: string; address?: string };
  payer: { name: string; cpf: string };
  dependents: Array<{ name: string; cpf: string; course: string; total: number }>;
  code: string;
  onDownload?: () => void;
  onEmail?: () => void;
}
export interface PickupCardProps {
  student: { name: string; group?: string; photo?: string };
  person: { name: string; relation: string; doc?: string; photo?: string; note?: string };
  status?: 'autorizado' | 'temporario' | 'bloqueado';
  validity?: string;
  qr?: string;
  onConfirm?: (time: string) => void;
  onDeny?: () => void;
}
export interface GateLogProps {
  counts?: { presentes?: number; saidas?: number; atrasos?: number; visitantes?: number };
  entries: Array<{
    time: string;
    kind: 'entrada' | 'saida' | 'atraso' | 'visitante' | 'antecipada';
    name: string;
    group?: string;
    by?: string;
  }>;
  live?: boolean;
}
export interface BookCardProps {
  title: string;
  author: string;
  year?: number;
  copies?: number;
  available?: number;
  shelf?: string;
  tags?: string[];
  onReserve?: (title: string) => void;
}
export interface LoanItemProps {
  book: string;
  author?: string;
  student: string;
  group?: string;
  due: string;
  status?: 'emdia' | 'vence' | 'atrasado' | 'devolvido';
  fine?: number;
  renewals?: number;
  maxRenewals?: number;
  onRenew?: () => void;
  onReturn?: () => void;
  index?: number;
}
export interface AgendaListProps {
  days: Array<{
    day: string;
    today?: boolean;
    items: Array<{
      kind: 'prova' | 'tarefa' | 'evento' | 'reuniao' | 'feriado' | 'passeio';
      time?: string;
      subject?: string;
      title: string;
      meta?: string;
      done?: boolean;
    }>;
  }>;
  onToggle?: (key: string) => void;
}
export interface AppointmentPickerProps {
  people: Array<{ id: string; name: string; role?: string; icon?: IconName }>;
  days: Array<{ id: string; week: string; num: number; label: string; slots: Array<{ time: string; free: boolean }> }>;
  onBook?: (b: { who?: string; day?: string; slot: string | null; mode: 'presencial' | 'online' }) => void;
}
export interface OccurrenceCardProps {
  kind?: 'disciplinar' | 'pedagogica' | 'saude' | 'elogio' | 'atraso';
  level?: string;
  student: string;
  group?: string;
  date: string;
  author: string;
  children?: React.ReactNode;
  measures?: string;
  acknowledged?: boolean;
  ackBy?: string;
  onAcknowledge?: () => void;
  guardianView?: boolean;
}
export interface EnrollmentChecklistProps {
  student: string;
  year?: number;
  step?: number;
  documents: Array<{ name: string; status: 'aprovado' | 'enviado' | 'pendente' | 'recusado'; note?: string }>;
  contract?: { summary?: string; signedAt?: string };
  onSign?: () => void;
}
export interface ProgramTrackerProps {
  student: string;
  programs: Array<'regular' | 'integral' | 'semi' | 'reforco'>;
  week?: Array<{ day: string; today?: boolean; [program: string]: boolean | string | null | undefined }>;
  blocks: Array<{
    time: string;
    program: 'regular' | 'integral' | 'semi' | 'reforco';
    status: 'feito' | 'agora' | 'proximo';
    title: string;
    note?: string;
    by?: string;
    icon?: IconName;
  }>;
  summary?: string;
}
export interface StudentTimelineProps {
  events: Array<{
    month: string;
    date: string;
    kind: 'nota' | 'falta' | 'ocorrencia' | 'atendimento' | 'elogio' | 'saude' | 'matricula' | 'financeiro';
    title: string;
    meta?: string;
  }>;
}
export type PermissionAction = 'ver' | 'criar' | 'editar' | 'excluir' | 'aprovar' | 'exportar';
export type PermissionMember = string | { name: string; role?: string; also?: string };
export interface PermissionGroup {
  id: string;
  name: string;
  icon?: IconName;
  color?: Cat;
  description?: string;
  members?: PermissionMember[];
}
export interface PermissionModule {
  id: string;
  name: string;
  icon: IconName;
  color?: Cat;
  section?: string;
  scopes?: string[];
  rules?: Array<{ id: string; label: string; hint?: string }>;
}
export interface PermissionRestriction {
  id: string;
  label: string;
  hint?: string;
}
export interface PermissionMatrixValue {
  groups: PermissionGroup[];
  value: Record<string, Record<string, PermissionAction[]>>;
  scopes: Record<string, Record<string, string>>;
  rules: Record<string, Record<string, string[]>>;
  restrictions: Record<string, string[]>;
}
export interface PermissionMatrixProps {
  groups?: PermissionGroup[];
  modules?: PermissionModule[];
  value?: Record<string, Record<string, PermissionAction[]>>;
  scopes?: Record<string, Record<string, string>>;
  rules?: Record<string, Record<string, string[]>>;
  restrictions?: Record<string, string[]>;
  restrictionOptions?: PermissionRestriction[];
  defaultGroup?: string;
  defaultTab?: 'modulos' | 'pessoas' | 'restricoes' | 'previa';
  defaultOpen?: string;
  onSave?: (v: PermissionMatrixValue) => void;
}
