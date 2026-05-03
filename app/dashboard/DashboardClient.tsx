'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Table2, BarChart2, TrendingUp, TrendingDown,
  Layers, History, Download, Copy, Check, Clock,
  Settings, Pin, RotateCcw, Trash2, ArrowRight, Loader2, Dices, ChevronDown,
} from 'lucide-react';
import {
  calculateBankroll,
  type BankrollSettings,
  type DayStatus,
  type DayData,
  DEFAULT_SETTINGS,
  formatBRL,
} from '@/lib/bankroll';
import {
  saveSettings, setDayStatus, resetStatuses, resetAll,
  getActivityLogs, type ActivityLog,
} from '@/lib/actions';
import { computeInsights } from '@/lib/insights';
import { computeRisk } from '@/lib/risk';
import Header from '@/components/Header';
import SettingsPanel from '@/components/SettingsPanel';

const ChartsPanel = dynamic(() => import('@/components/ChartsPanel'), {
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]">
      <Loader2 className="w-5 h-5 animate-spin text-[#94A3B8]" />
    </div>
  ),
  ssr: false,
});
import BankrollTable from '@/components/BankrollTable';
import { ToastContainer, type Toast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import InsightsPanel from '@/components/InsightsPanel';
import GoalProgress from '@/components/GoalProgress';
import RiskAnalysis from '@/components/RiskAnalysis';
import SessionsManager from '@/components/SessionsManager';
import ApostasView from '@/components/ApostasView';
import { useTheme } from '@/context/ThemeProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'simulacao' | 'graficos' | 'analise' | 'sessoes' | 'historico' | 'apostas';

interface Props {
  user: { id: string; email: string };
  initialSettings: BankrollSettings;
  initialStatuses: Record<number, DayStatus>;
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard',  label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'simulacao',  label: 'Simulação',  Icon: Table2 },
  { id: 'graficos',   label: 'Gráficos',   Icon: BarChart2 },
  { id: 'analise',    label: 'Análise',    Icon: TrendingUp },
  { id: 'apostas',    label: 'Apostas',    Icon: Dices },
  { id: 'sessoes',    label: 'Sessões',    Icon: Layers },
  { id: 'historico',  label: 'Histórico',  Icon: History },
];

const FADE = {
  initial:    { opacity: 0, y: 10 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: 'easeOut' as const },
};

const ACTION_CFG: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }>; bg: string; bgDark: string; color: string; colorDark: string }> = {
  settings_updated: { label: 'Configurações alteradas', Icon: Settings,  bg: '#EFF6FF', bgDark: '#1e3a5f', color: '#1D4ED8', colorDark: '#93C5FD' },
  status_updated:   { label: 'Status do dia',           Icon: Pin,       bg: '#F0FDF4', bgDark: '#14532D', color: '#15803D', colorDark: '#4ADE80' },
  statuses_reset:   { label: 'Registros resetados',     Icon: RotateCcw, bg: '#FFFBEB', bgDark: '#1E293B', color: '#92400E', colorDark: '#FBBF24' },
  full_reset:       { label: 'Reset completo',          Icon: Trash2,    bg: '#FEF2F2', bgDark: '#7F1D1D', color: '#DC2626', colorDark: '#FCA5A5' },
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardClient({ user, initialSettings, initialStatuses }: Props) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [settings, setSettings] = useState<BankrollSettings>(initialSettings);
  const [statuses, setStatuses] = useState<Record<number, DayStatus>>(initialStatuses);
  const [saving, setSaving] = useState(false);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<null | 'statuses' | 'all'>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    const saved = localStorage.getItem('banca_tab') as Tab | null;
    if (saved && TABS.some(t => t.id === saved)) setTab(saved);
  }, []);

  const changeTab = useCallback((t: Tab) => {
    setTab(t);
    localStorage.setItem('banca_tab', t);
  }, []);

  const days = calculateBankroll(settings.initial_bankroll, settings.daily_return, statuses);
  const insightSummary = computeInsights(days, settings.goal, settings.initial_bankroll);
  const riskMetrics = computeRisk(days, settings.daily_return);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleChange = (field: keyof BankrollSettings, value: number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings.initial_bankroll, settings.daily_return, settings.goal);
      addToast('success', 'Configurações salvas!');
    } catch {
      addToast('error', 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (day: number, status: DayStatus) => {
    setStatuses(prev => ({ ...prev, [day]: status }));
    setSavingDay(day);
    try {
      await setDayStatus(day, status);
    } finally {
      setSavingDay(null);
    }
  };

  const handleResetStatuses = () => {
    startTransition(async () => {
      await resetStatuses();
      setStatuses({});
      addToast('success', 'Registros resetados!');
    });
  };

  const handleResetAll = () => {
    startTransition(async () => {
      await resetAll();
      setSettings(DEFAULT_SETTINGS);
      setStatuses({});
      addToast('success', 'Reset completo realizado!');
    });
  };

  const handleLoadSession = useCallback((newSettings: BankrollSettings, newStatuses: Record<number, DayStatus>) => {
    setSettings(newSettings);
    setStatuses(newStatuses);
    changeTab('simulacao');
    addToast('success', 'Sessão carregada com sucesso!');
  }, [changeTab, addToast]);

  const handleExportCSV = () => {
    const header = ['Dia', 'Investimento', 'Retorno%', 'Lucro', 'Acumulado', 'Status'];
    const rows = days.map(d => [d.day, d.investment.toFixed(2), d.dailyReturn, d.profit.toFixed(2), d.accumulated.toFixed(2), d.status]);
    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banca-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'CSV exportado!');
  };

  const handleCopy = async () => {
    const text = [
      '📊 Simulador de Banca — Resumo',
      `Banca inicial: ${formatBRL(settings.initial_bankroll)}`,
      `Retorno diário: ${settings.daily_return}%`,
      `Meta: ${formatBRL(settings.goal)}`,
      `Banca projetada (180d): ${formatBRL(days[179].accumulated)}`,
      `Taxa de vitória: ${insightSummary.winRate.toFixed(1)}%`,
      `Crescimento total: +${insightSummary.totalGrowthPct.toFixed(1)}%`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('success', 'Resumo copiado!');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <Header user={user} />

      {/* ── Tab navigation bar ── */}
      <div className="sticky top-14 z-20 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex min-w-max">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === id
                    ? 'text-[#2563EB]'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {tab === id && (
                  <motion.div
                    layoutId="tabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} {...FADE}>

          {/* ══ DASHBOARD ══ */}
          {tab === 'dashboard' && (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

              {/* Configurações colapsável */}
              <SettingsCollapsible
                settings={settings}
                dark={dark}
                onChange={handleChange}
                onSave={handleSave}
                onResetStatuses={() => setConfirm('statuses')}
                onResetAll={() => setConfirm('all')}
                saving={saving || isPending}
              />

              {/* HERO — Banca Atual */}
              <BancaHero
                current={insightSummary.currentBankroll}
                initial={settings.initial_bankroll}
                goal={settings.goal}
                activeDays={insightSummary.activeDays}
                wins={insightSummary.wins}
                losses={insightSummary.losses}
                winRate={insightSummary.winRate}
              />

              {/* KPI Strip — 3 projeções */}
              <KPIStrip days={days} initialBankroll={settings.initial_bankroll} />

              {/* Sua Performance */}
              <PerformanceBlock
                current={insightSummary.currentBankroll}
                goal={settings.goal}
                activeDays={insightSummary.activeDays}
                daysToGoal={insightSummary.daysToGoal}
                insights={insightSummary.insights.slice(0, 3)}
                onViewAll={() => changeTab('analise')}
              />

              {/* Ações */}
              <ActionsRow onNav={changeTab} dark={dark} />

            </div>
          )}

          {/* ══ SIMULAÇÃO ══ */}
          {tab === 'simulacao' && (
            <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {insightSummary.activeDays} dias · {insightSummary.wins}V {insightSummary.losses}D
                  </span>
                  {insightSummary.activeDays > 0 && (
                    <>
                      <span className="w-px h-3 bg-[#E2E8F0] dark:bg-[#334155]" />
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{
                          color: insightSummary.currentBankroll >= settings.initial_bankroll
                            ? (dark ? '#4ADE80' : '#16A34A')
                            : (dark ? '#FCA5A5' : '#DC2626'),
                        }}
                      >
                        Banca: {formatBRL(insightSummary.currentBankroll)}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] dark:bg-[#1e3a5f] border border-[#BFDBFE] dark:border-[#1e40af] px-3 py-1.5 rounded-lg hover:bg-[#DBEAFE] dark:hover:bg-[#1e40af] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] px-3 py-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar resumo'}
                  </button>
                </div>
              </div>
              <BankrollTable
                days={days}
                onStatusChange={handleStatusChange}
                savingDay={savingDay}
                goal={settings.goal}
              />
            </div>
          )}

          {/* ══ GRÁFICOS ══ */}
          {tab === 'graficos' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
              <ChartsPanel
                days={days}
                initialBankroll={settings.initial_bankroll}
                dailyReturn={settings.daily_return}
              />
            </div>
          )}

          {/* ══ ANÁLISE ══ */}
          {tab === 'analise' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
              <GoalProgress
                current={insightSummary.currentBankroll}
                goal={settings.goal}
                activeDays={insightSummary.activeDays}
                daysToGoal={insightSummary.daysToGoal}
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <InsightsPanel summary={insightSummary} />
                </div>
                <RiskAnalysis metrics={riskMetrics} dailyReturn={settings.daily_return} />
              </div>
            </div>
          )}

          {/* ══ APOSTAS ══ */}
          {tab === 'apostas' && (
            <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6">
              <ApostasView
                simulationDays={days}
                initialBankroll={settings.initial_bankroll}
              />
            </div>
          )}

          {/* ══ SESSÕES ══ */}
          {tab === 'sessoes' && (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
              <SessionsManager
                currentSettings={settings}
                currentStatuses={statuses}
                onLoad={handleLoadSession}
              />
            </div>
          )}

          {/* ══ HISTÓRICO ══ */}
          {tab === 'historico' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
              <HistoricoView />
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ConfirmModal
        open={confirm === 'statuses'}
        title="Resetar Registros"
        description="Todos os status dos dias serão apagados. Essa ação não pode ser desfeita."
        confirmLabel="Sim, resetar registros"
        onConfirm={handleResetStatuses}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'all'}
        title="Resetar Tudo"
        description="Configurações e todos os registros serão apagados permanentemente. Essa ação não pode ser desfeita."
        confirmLabel="Sim, resetar tudo"
        confirmDanger
        onConfirm={handleResetAll}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ─── Settings Collapsible ─────────────────────────────────────────────────────

function SettingsCollapsible({
  settings, dark, onChange, onSave, onResetStatuses, onResetAll, saving,
}: {
  settings: BankrollSettings; dark: boolean;
  onChange: (f: keyof BankrollSettings, v: number) => void;
  onSave: () => Promise<void>; onResetStatuses: () => void; onResetAll: () => void;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/30 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Settings className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
          <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Configurações da banca</span>
          <span className="hidden sm:inline text-xs text-[#CBD5E1] dark:text-[#475569] truncate">
            · {formatBRL(settings.initial_bankroll)} · {settings.daily_return}%/dia · Meta {formatBRL(settings.goal)}
          </span>
        </div>
        <ChevronDown
          className="w-4 h-4 text-[#CBD5E1] dark:text-[#475569] flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E2E8F0] dark:border-[#334155]">
              <SettingsPanel
                settings={settings}
                onChange={onChange}
                onSave={onSave}
                onResetStatuses={onResetStatuses}
                onResetAll={onResetAll}
                saving={saving}
                saveMsg={null}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Banca Hero ───────────────────────────────────────────────────────────────

function BancaHero({
  current, initial, goal, activeDays, wins, losses, winRate,
}: {
  current: number; initial: number; goal: number;
  activeDays: number; wins: number; losses: number; winRate: number;
}) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const gain = current - initial;
  const gainPct = initial > 0 ? (gain / initial) * 100 : 0;
  const isPositive = gain >= 0;
  const goalPct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;

  const col  = isPositive ? '#16A34A' : '#DC2626';
  const colDk = isPositive ? '#4ADE80' : '#FCA5A5';
  const bg   = isPositive ? (dark ? '#061410' : '#f0fdf4') : (dark ? '#160808' : '#fef2f2');
  const bdr  = isPositive ? (dark ? '#14532d' : '#bbf7d0') : (dark ? '#7f1d1d' : '#fecaca');

  const textCol = dark ? colDk : col;

  return (
    <div
      className="rounded-3xl border p-8"
      style={{
        background: bg,
        borderColor: bdr,
        boxShadow: `0 0 60px ${col}12, 0 0 120px ${col}06, 0 4px 32px rgba(0,0,0,0.06)`,
      }}
    >
      {/* Label */}
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: textCol, opacity: 0.6 }}>
        Banca Atual
      </p>

      {/* Main value — animates on change */}
      <motion.p
        key={Math.round(current * 100)}
        initial={{ opacity: 0.5, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-5xl sm:text-6xl font-black tabular-nums leading-none mb-4"
        style={{ color: textCol }}
      >
        {formatBRL(current)}
      </motion.p>

      {/* Gain row */}
      <div className="flex items-center gap-2 mb-7 flex-wrap">
        {isPositive
          ? <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: textCol }} />
          : <TrendingDown className="w-4 h-4 flex-shrink-0" style={{ color: textCol }} />
        }
        <span className="text-base font-semibold tabular-nums" style={{ color: textCol }}>
          {isPositive ? '+' : ''}{formatBRL(gain)}
          {' '}
          <span className="font-black">({isPositive ? '+' : ''}{gainPct.toFixed(1)}%)</span>
        </span>
        <span className="text-sm" style={{ color: textCol, opacity: 0.45 }}>vs banca inicial</span>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2" style={{ color: textCol }}>
          <span className="text-[11px] font-semibold" style={{ opacity: 0.55 }}>{formatBRL(initial)}</span>
          <span className="text-[11px] font-bold">{goalPct.toFixed(0)}% da meta</span>
          <span className="text-[11px] font-semibold" style={{ opacity: 0.55 }}>{formatBRL(goal)}</span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}
        >
          <motion.div
            animate={{ width: `${goalPct}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: textCol }}
          />
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Vitórias', value: wins },
          { label: 'Derrotas', value: losses },
          { label: 'Acerto',   value: `${winRate.toFixed(0)}%` },
          { label: 'Dias',     value: activeDays },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              color: textCol,
            }}
          >
            <span style={{ opacity: 0.6 }}>{s.label}</span>
            <span className="font-black">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Strip — 3 cards ─────────────────────────────────────────────────────

function KPIStrip({ days, initialBankroll }: { days: DayData[]; initialBankroll: number }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const items = [
    { period: 30,  label: '30 dias',  col: dark ? '#93C5FD' : '#2563EB', bg: dark ? '#0e1e38' : '#EFF6FF', bdr: dark ? '#1e40af' : '#BFDBFE' },
    { period: 90,  label: '90 dias',  col: dark ? '#4ADE80' : '#16A34A', bg: dark ? '#0a2018' : '#F0FDF4', bdr: dark ? '#166534' : '#BBF7D0' },
    { period: 180, label: '180 dias', col: dark ? '#C4B5FD' : '#7C3AED', bg: dark ? '#160e30' : '#F5F3FF', bdr: dark ? '#4c1d95' : '#DDD6FE' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(({ period, label, col, bg, bdr }, i) => {
        const day = days[period - 1];
        const gain = initialBankroll > 0 ? ((day.accumulated - initialBankroll) / initialBankroll) * 100 : 0;
        return (
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="rounded-2xl border p-5 cursor-default"
            style={{ background: bg, borderColor: bdr }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: col, opacity: 0.65 }}>
              {label}
            </p>
            <p className="text-xl font-black tabular-nums leading-none mb-2" style={{ color: col }}>
              {formatBRL(day.accumulated)}
            </p>
            <p className="text-xs font-semibold tabular-nums" style={{ color: col, opacity: 0.55 }}>
              +{gain.toFixed(1)}%
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Performance Block ────────────────────────────────────────────────────────

function PerformanceBlock({
  current, goal, activeDays, daysToGoal, insights, onViewAll,
}: {
  current: number; goal: number; activeDays: number;
  daysToGoal: number | null;
  insights: ReturnType<typeof computeInsights>['insights'];
  onViewAll: () => void;
}) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;

  const TYPE_COL: Record<string, string> = {
    success: '#22C55E', warning: '#F59E0B', info: '#3B82F6', danger: '#EF4444',
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Sua performance</h3>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
        >
          Ver análise completa <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] tabular-nums">{pct.toFixed(1)}% da meta</span>
          {daysToGoal !== null
            ? <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">~{daysToGoal} dias restantes</span>
            : <span className="text-xs text-[#94A3B8] dark:text-[#64748B]">{activeDays} dias ativos</span>
          }
        </div>
        <div className="h-2 bg-[#F1F5F9] dark:bg-[#0F172A] rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]"
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#94A3B8] dark:text-[#64748B] mt-1.5">
          <span>{formatBRL(current)}</span>
          <span>Meta: {formatBRL(goal)}</span>
        </div>
      </div>

      {/* Insights */}
      {insights.length === 0 ? (
        <p className="text-xs text-center text-[#94A3B8] dark:text-[#64748B] py-3">
          {activeDays === 0
            ? 'Registre dias na aba Simulação para ver sua performance'
            : 'Continue registrando para gerar insights'}
        </p>
      ) : (
        <div className="space-y-4">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ background: TYPE_COL[ins.type], minHeight: 28 }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">{ins.title}</p>
                <p className="text-[11px] text-[#94A3B8] dark:text-[#64748B] truncate mt-0.5">{ins.description}</p>
              </div>
              <span className="text-sm font-black text-[#0F172A] dark:text-[#F1F5F9] tabular-nums flex-shrink-0">
                {ins.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Actions Row ──────────────────────────────────────────────────────────────

function ActionsRow({ onNav, dark }: { onNav: (t: Tab) => void; dark: boolean }) {
  const items: { label: string; sub: string; tab: Tab; Icon: React.ComponentType<{ className?: string }> }[] = [
    { label: 'Ver Simulação', sub: '180 dias detalhados', tab: 'simulacao', Icon: Table2 },
    { label: 'Ver Análise',   sub: 'Risco e insights',    tab: 'analise',   Icon: TrendingUp },
    { label: 'Apostas Reais', sub: 'Performance real',    tab: 'apostas',   Icon: Dices },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map(({ label, sub, tab, Icon }) => (
        <button
          key={tab}
          onClick={() => onNav(tab)}
          className="group flex items-center justify-between px-5 py-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#BFDBFE] dark:hover:border-[#1e40af] hover:shadow-sm transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center group-hover:bg-[#EFF6FF] dark:group-hover:bg-[#1e3a5f] transition-colors">
              <Icon className="w-4 h-4 text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{label}</p>
              <p className="text-[11px] text-[#94A3B8] dark:text-[#64748B]">{sub}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#CBD5E1] dark:text-[#475569] group-hover:text-[#2563EB] flex-shrink-0 transition-colors" />
        </button>
      ))}
    </div>
  );
}

// ─── Histórico View ───────────────────────────────────────────────────────────

function HistoricoView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const dark = theme === 'dark';

  useEffect(() => {
    getActivityLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">Histórico de Atividades</h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">Todas as ações realizadas na conta</p>
        </div>
        <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-full px-3 py-1.5">
          {logs.length} registro(s)
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-12 text-center">
          <Clock className="w-10 h-10 text-[#CBD5E1] dark:text-[#475569] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">Nenhuma atividade registrada</p>
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">As ações realizadas no sistema aparecerão aqui.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]" style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  {['Data / Hora', 'Ação', 'Detalhes'].map(h => (
                    <th key={h} className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155] px-4 py-3 text-left text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const cfg = ACTION_CFG[log.action];
                  return (
                    <tr key={log.id} className="border-b border-[#F1F5F9] dark:border-[#334155]/50 last:border-b-0 hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-[#94A3B8] dark:text-[#64748B]">
                        {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cfg ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: dark ? cfg.bgDark : cfg.bg, color: dark ? cfg.colorDark : cfg.color }}>
                            <cfg.Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] text-xs">{log.action}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(log.details ?? {}).map(([k, v]) => (
                            <span key={k} className="inline-flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] px-2 py-0.5 text-xs text-[#475569] dark:text-[#94A3B8] rounded-full">
                              <span className="text-[#94A3B8]">{k}:</span>
                              <span className="font-semibold">{String(v)}</span>
                            </span>
                          ))}
                          {Object.keys(log.details ?? {}).length === 0 && (
                            <span className="text-[#94A3B8] text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
