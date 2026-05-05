'use client';

import { Fragment, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock3, BadgeCheck, Target, TrendingUp, Filter, RefreshCw, RotateCcw } from 'lucide-react';
import { type DayData, type DayStatus, formatBRL, formatPct } from '@/lib/bankroll';
import { useTheme } from '@/context/ThemeProvider';
import Tabs from '@/components/Tabs';

interface BankrollTableProps {
  days: DayData[];
  onStatusChange: (day: number, status: DayStatus) => Promise<void>;
  savingDay: number | null;
  goal?: number;
}

const STATUS_CFG: Record<DayStatus, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge: string; badgeDark: string;
  badgeText: string; badgeTextDark: string;
  dot: string;
  rowBg: string; rowBgDark: string;
  btnActive: string; btnActiveDark: string;
  btnActiveBorder: string;
  btnActiveText: string; btnActiveTextDark: string;
}> = {
  pendente: {
    label: 'Pendente',    Icon: Clock3,
    badge: '#F1F5F9',    badgeDark: '#1E293B',
    badgeText: '#64748B', badgeTextDark: '#94A3B8',
    dot: '#CBD5E1',
    rowBg: '',            rowBgDark: '',
    btnActive: '#F1F5F9', btnActiveDark: '#334155',
    btnActiveBorder: '#CBD5E1',
    btnActiveText: '#64748B', btnActiveTextDark: '#94A3B8',
  },
  vitoria: {
    label: 'Vitória',    Icon: CheckCircle2,
    badge: '#DCFCE7',    badgeDark: '#14532D',
    badgeText: '#15803D', badgeTextDark: '#4ADE80',
    dot: '#22C55E',
    rowBg: '#F0FDF4',    rowBgDark: '#0d2618',
    btnActive: '#DCFCE7', btnActiveDark: '#14532D',
    btnActiveBorder: '#86EFAC',
    btnActiveText: '#15803D', btnActiveTextDark: '#4ADE80',
  },
  derrota: {
    label: 'Derrota',    Icon: XCircle,
    badge: '#FEE2E2',    badgeDark: '#7F1D1D',
    badgeText: '#DC2626', badgeTextDark: '#FCA5A5',
    dot: '#EF4444',
    rowBg: '#FFF5F5',    rowBgDark: '#1f0d0d',
    btnActive: '#FEE2E2', btnActiveDark: '#7F1D1D',
    btnActiveBorder: '#FCA5A5',
    btnActiveText: '#DC2626', btnActiveTextDark: '#FCA5A5',
  },
  concluido: {
    label: 'Concluído',  Icon: BadgeCheck,
    badge: '#EFF6FF',    badgeDark: '#1e3a5f',
    badgeText: '#2563EB', badgeTextDark: '#60A5FA',
    dot: '#3B82F6',
    rowBg: '#F0FDF4',    rowBgDark: '#0d2618',
    btnActive: '#EFF6FF', btnActiveDark: '#1e3a5f',
    btnActiveBorder: '#93C5FD',
    btnActiveText: '#2563EB', btnActiveTextDark: '#60A5FA',
  },
};

const ALL_STATUSES = Object.keys(STATUS_CFG) as DayStatus[];

const TAB_SEGMENTS = [
  { label: 'Dias 1 – 60',    value: 0, blocks: [[1, 30],    [31, 60]]   as [number, number][] },
  { label: 'Dias 61 – 120',  value: 1, blocks: [[61, 90],   [91, 120]]  as [number, number][] },
  { label: 'Dias 121 – 180', value: 2, blocks: [[121, 150], [151, 180]] as [number, number][] },
];

const HEADERS = [
  { key: 'dia',    label: 'Dia',          align: 'left'  },
  { key: 'inv',    label: 'Investimento', align: 'right' },
  { key: 'ret',    label: 'Retorno',      align: 'right' },
  { key: 'lucro',  label: 'Lucro',        align: 'right' },
  { key: 'acum',   label: 'Acumulado',    align: 'right' },
  { key: 'status', label: 'Status',       align: 'left'  },
  { key: 'acao',   label: 'Ação',         align: 'left'  },
];

function DayTable({ days, from, to, onStatusChange, savingDay, goal, filter }: {
  days: DayData[]; from: number; to: number;
  onStatusChange: (day: number, status: DayStatus) => Promise<void>;
  savingDay: number | null; goal?: number;
  filter: DayStatus | 'all';
}) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  let slice = days.slice(from - 1, to);
  if (filter !== 'all') slice = slice.filter(d => d.status === filter);
  const lastDay = days[to - 1];
  const hasOverride = (d: DayData) =>
    d.status === 'vitoria' || d.status === 'concluido' || d.status === 'derrota';

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9] dark:border-[#334155]">
        <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Dias {from} – {to}</span>
        <span className="text-[10px] font-medium text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-full px-2.5 py-0.5">
          {slice.length} / {to - from + 1}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-[12.5px] w-full" style={{ minWidth: 600 }}>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#F1F5F9] dark:border-[#334155]">
              {HEADERS.map((h) => (
                <th
                  key={h.key}
                  className={`bg-[#F8FAFC] dark:bg-[#0F172A] px-3 py-2.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap ${h.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((d, idx) => {
              const cfg = STATUS_CFG[d.status];
              const isSaving = savingDay === d.day;
              const over = hasOverride(d);
              const goalReached = goal !== undefined && d.accumulated >= goal;
              const evenRow = idx % 2 === 1;

              const rowBg = over
                ? (dark ? cfg.rowBgDark : cfg.rowBg)
                : (evenRow
                  ? (dark ? '#1a2538' : '#FAFBFC')
                  : (dark ? '#1E293B' : '#FFFFFF'));

              const badgeBg   = dark ? cfg.badgeDark    : cfg.badge;
              const badgeTxt  = dark ? cfg.badgeTextDark : cfg.badgeText;
              const accumBg   = dark ? '#0f1f3d'  : '#EFF6FF';
              const accumTxt  = dark ? '#93C5FD'  : '#1e40af';

              return (
                <Fragment key={d.day}>
                  {/* Adjustment divider row */}
                  {d.adjustment && (
                    <tr style={{ backgroundColor: dark ? '#1c1609' : '#FFFBEB' }}>
                      <td colSpan={7} className="px-3 py-2 border-y border-[#FDE68A] dark:border-[#78350F]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {d.adjustment.type === 'sync'
                            ? <RefreshCw className="w-3 h-3 text-[#D97706] dark:text-[#FBBF24] flex-shrink-0" />
                            : <RotateCcw className="w-3 h-3 text-[#D97706] dark:text-[#FBBF24] flex-shrink-0" />
                          }
                          <span className="text-[11px] font-bold text-[#92400E] dark:text-[#FBBF24] uppercase tracking-wider">
                            {d.adjustment.type === 'sync' ? 'Sincronização de banca' : 'Reset de banca'}
                          </span>
                          <span className="text-[11px] text-[#B45309] dark:text-[#F59E0B] tabular-nums">
                            {formatBRL(d.adjustment.old_value)} → {formatBRL(d.adjustment.new_value)}
                          </span>
                          {d.adjustment.created_at && (
                            <span className="text-[10px] text-[#D97706] dark:text-[#FBBF24] opacity-60 ml-auto">
                              {new Date(d.adjustment.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                <tr
                  className="border-b border-[#F8FAFC] dark:border-[#334155]/40 last:border-b-0 transition-colors"
                  style={{ backgroundColor: rowBg, opacity: isSaving ? 0.45 : 1 }}
                >
                  {/* Dia */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-[#94A3B8] dark:text-[#64748B]">
                        {String(d.day).padStart(3, '0')}
                      </span>
                      {goalReached && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#2563EB] bg-[#EFF6FF] dark:bg-[#1e3a5f] border border-[#BFDBFE] dark:border-[#1e40af] px-1.5 py-0.5 rounded-full leading-none">
                          <Target className="w-2.5 h-2.5" />
                          Meta
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Investimento */}
                  <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-[#334155] dark:text-[#CBD5E1] font-medium">
                    {formatBRL(d.investment)}
                  </td>

                  {/* Retorno */}
                  <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
                    <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">{formatPct(d.dailyReturn)}</span>
                  </td>

                  {/* Lucro */}
                  <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
                    <span className={over && d.status === 'derrota'
                      ? 'text-[#DC2626] dark:text-[#FCA5A5] font-semibold'
                      : 'text-[#16A34A] dark:text-[#4ADE80] font-semibold'
                    }>
                      {formatBRL(d.profit)}
                    </span>
                  </td>

                  {/* Acumulado */}
                  <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
                    <span
                      className="font-bold"
                      style={over
                        ? { color: dark ? '#CBD5E1' : '#0F172A' }
                        : { background: accumBg, color: accumTxt, padding: '2px 8px', borderRadius: '6px' }
                      }
                    >
                      {formatBRL(d.accumulated)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: badgeBg, color: badgeTxt }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-2.5 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {ALL_STATUSES.map((s) => {
                        const sc = STATUS_CFG[s];
                        const isActive = d.status === s;
                        const btnBg   = isActive ? (dark ? sc.btnActiveDark    : sc.btnActive)    : (dark ? '#334155' : '#F8FAFC');
                        const btnTxt  = isActive ? (dark ? sc.btnActiveTextDark : sc.btnActiveText) : (dark ? '#64748B' : '#94A3B8');
                        const btnBorder = isActive ? sc.btnActiveBorder : (dark ? '#475569' : '#CBD5E1');
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={isSaving}
                            onClick={() => onStatusChange(d.day, s)}
                            title={sc.label}
                            className="flex items-center justify-center w-7 h-7 rounded-lg border-2 transition-all duration-150 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                            style={{
                              background: btnBg,
                              borderColor: btnBorder,
                              color: btnTxt,
                              boxShadow: isActive ? `0 0 0 3px ${sc.btnActiveBorder}40` : undefined,
                            }}
                          >
                            <sc.Icon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
                </Fragment>
              );
            })}

            {slice.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#94A3B8] dark:text-[#64748B]">
                  Nenhum dia com esse status
                </td>
              </tr>
            )}

            {/* Summary row */}
            <tr
              className="border-t-2 border-[#D1FAE5] dark:border-[#166534]"
              style={{ backgroundColor: dark ? '#0d2618' : '#F0FDF4' }}
            >
              <td colSpan={3} className="px-3 py-2.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                  <span className="text-xs font-bold text-[#14532D] dark:text-[#4ADE80]">
                    Banca Final — Dias {from}–{to}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                <span className="text-xs font-bold text-[#16A34A] dark:text-[#4ADE80]">
                  {formatBRL(lastDay.profit)}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                <span
                  className="font-bold text-sm"
                  style={{
                    background: dark ? '#14532D' : '#BBF7D0',
                    color: dark ? '#4ADE80' : '#14532D',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {formatBRL(lastDay.accumulated)}
                </span>
              </td>
              <td colSpan={2} className="px-3 py-2.5 text-[#94A3B8] text-xs">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BankrollTable({ days, onStatusChange, savingDay, goal }: BankrollTableProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [filter, setFilter] = useState<DayStatus | 'all'>('all');
  const current = TAB_SEGMENTS[activeTab];

  const FILTER_OPTIONS: { value: DayStatus | 'all'; label: string }[] = [
    { value: 'all',       label: 'Todos' },
    { value: 'pendente',  label: 'Pendente' },
    { value: 'vitoria',   label: 'Vitória' },
    { value: 'derrota',   label: 'Derrota' },
    { value: 'concluido', label: 'Concluído' },
  ];

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Simulação 180 Dias</h2>
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-0.5">Acompanhamento dia a dia da sua banca</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#64748B]" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as DayStatus | 'all')}
              className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              {FILTER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Tabs
            tabs={TAB_SEGMENTS.map((t) => ({ label: t.label, value: t.value }))}
            active={activeTab}
            onChange={(v) => setActiveTab(v as number)}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex flex-col lg:flex-row gap-4"
        >
          {current.blocks.map(([from, to]) => (
            <div key={`${from}-${to}`} className="flex-1 min-w-0">
              <DayTable
                days={days}
                from={from}
                to={to}
                onStatusChange={onStatusChange}
                savingDay={savingDay}
                goal={goal}
                filter={filter}
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
