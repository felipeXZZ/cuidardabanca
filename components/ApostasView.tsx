'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Pencil, Trash2, Filter, TrendingUp, TrendingDown,
  DollarSign, Target, BarChart2, Loader2, Search,
  Trophy, Lightbulb, AlertTriangle, ArrowUp, ArrowDown,
  ArrowUpDown, CheckCircle,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';
import {
  type Bet, type BetFormData, type BetResult, type BetStats, type TeamStats, type BetInsight,
  EMPTY_FORM, calculateProfit, computeBetStats, computeTeamStats, computeBetInsights,
} from '@/lib/bets';
import { getBets, addBet, updateBet, deleteBet } from '@/lib/bet-actions';
import { formatBRL, type DayData } from '@/lib/bankroll';
import ConfirmModal from '@/components/ConfirmModal';
import { ToastContainer, type Toast } from '@/components/Toast';

const BetsChartsPanel = dynamic(() => import('@/components/BetsChartsPanel'), {
  loading: () => (
    <div className="flex items-center justify-center h-48 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
      <Loader2 className="w-5 h-5 animate-spin text-[#94A3B8]" />
    </div>
  ),
  ssr: false,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  simulationDays: DayData[];
  initialBankroll: number;
}

type SubView = 'tabela' | 'graficos' | 'rankings' | 'insights';
type SortField = 'bet_date' | 'event' | 'odd' | 'stake' | 'result' | 'profit';

const SUBVIEWS: { id: SubView; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'tabela',   label: 'Tabela',   Icon: Target },
  { id: 'graficos', label: 'Gráficos', Icon: BarChart2 },
  { id: 'rankings', label: 'Rankings', Icon: Trophy },
  { id: 'insights', label: 'Insights', Icon: Lightbulb },
];

const RESULT_LABEL: Record<BetResult, string> = { vitoria: 'Vitória', derrota: 'Derrota' };

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApostasView({ simulationDays, initialBankroll }: Props) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subView, setSubView] = useState<SubView>('tabela');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [form, setForm] = useState<BetFormData>(EMPTY_FORM);

  const [searchEvent, setSearchEvent] = useState('');
  const [filterResult, setFilterResult] = useState<'' | BetResult>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterOddMin, setFilterOddMin] = useState('');
  const [filterOddMax, setFilterOddMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>('bet_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    getBets().then(data => { setBets(data); setLoading(false); });
  }, []);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const stats = useMemo(() => computeBetStats(bets), [bets]);
  const teamStats = useMemo(() => computeTeamStats(bets), [bets]);
  const insights = useMemo(() => computeBetInsights(bets), [bets]);

  const formProfit = useMemo(() => {
    const odd = parseFloat(form.odd);
    const stake = parseFloat(form.stake);
    if (isNaN(odd) || isNaN(stake) || odd <= 1 || stake <= 0) return null;
    return calculateProfit(odd, stake, form.result);
  }, [form.odd, form.stake, form.result]);

  const filteredBets = useMemo(() => {
    let result = [...bets];
    if (searchEvent.trim()) result = result.filter(b => b.event.toLowerCase().includes(searchEvent.toLowerCase()));
    if (filterResult) result = result.filter(b => b.result === filterResult);
    if (filterDateFrom) result = result.filter(b => b.bet_date >= filterDateFrom);
    if (filterDateTo) result = result.filter(b => b.bet_date <= filterDateTo);
    if (filterOddMin && !isNaN(parseFloat(filterOddMin))) result = result.filter(b => b.odd >= parseFloat(filterOddMin));
    if (filterOddMax && !isNaN(parseFloat(filterOddMax))) result = result.filter(b => b.odd <= parseFloat(filterOddMax));
    result.sort((a, b) => {
      const av = a[sortField] as string | number;
      const bv = b[sortField] as string | number;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [bets, searchEvent, filterResult, filterDateFrom, filterDateTo, filterOddMin, filterOddMax, sortField, sortDir]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const odd = parseFloat(form.odd);
    const stake = parseFloat(form.stake);
    if (!form.event.trim() || isNaN(odd) || isNaN(stake) || odd <= 1 || stake <= 0) {
      addToast('error', 'Preencha todos os campos corretamente.');
      return;
    }
    const profit = calculateProfit(odd, stake, form.result);
    setSaving(true);
    try {
      if (editingBet) {
        await updateBet(editingBet.id, form.bet_date, form.event.trim(), odd, stake, form.result, profit);
        setBets(prev => prev.map(b =>
          b.id === editingBet.id
            ? { ...b, bet_date: form.bet_date, event: form.event.trim(), odd, stake, result: form.result, profit }
            : b
        ));
        addToast('success', 'Aposta atualizada!');
      } else {
        await addBet(form.bet_date, form.event.trim(), odd, stake, form.result, profit);
        const updated = await getBets();
        setBets(updated);
        addToast('success', 'Aposta registrada!');
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingBet(null);
    } catch {
      addToast('error', 'Erro ao salvar aposta.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (bet: Bet) => {
    setEditingBet(bet);
    setForm({ bet_date: bet.bet_date, event: bet.event, odd: String(bet.odd), stake: String(bet.stake), result: bet.result });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete);
    try {
      await deleteBet(confirmDelete);
      setBets(prev => prev.filter(b => b.id !== confirmDelete));
      addToast('success', 'Aposta excluída!');
    } catch {
      addToast('error', 'Erro ao excluir aposta.');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingBet(null);
    setForm(EMPTY_FORM);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">Apostas Reais</h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            {bets.length} aposta{bets.length !== 1 ? 's' : ''} · {stats.totalProfit >= 0 ? '+' : ''}{formatBRL(stats.totalProfit)} lucro total
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm && editingBet) { handleCancelForm(); return; }
            setShowForm(f => !f);
            if (showForm) { setEditingBet(null); setForm(EMPTY_FORM); }
          }}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 rounded-xl transition-colors"
        >
          {showForm && !editingBet ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm && !editingBet ? 'Fechar' : 'Nova Aposta'}
        </button>
      </div>

      {/* Add / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  {editingBet ? 'Editar Aposta' : 'Registrar Nova Aposta'}
                </span>
                {formProfit !== null && (
                  <span className={`text-sm font-bold tabular-nums px-3 py-1 rounded-lg ${
                    formProfit >= 0
                      ? 'text-[#16A34A] bg-[#F0FDF4] dark:bg-[#14532D] dark:text-[#4ADE80]'
                      : 'text-[#DC2626] bg-[#FEF2F2] dark:bg-[#7F1D1D] dark:text-[#FCA5A5]'
                  }`}>
                    {formProfit >= 0 ? '+' : ''}{formatBRL(formProfit)}
                  </span>
                )}
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Data</label>
                    <input
                      type="date"
                      value={form.bet_date}
                      onChange={e => setForm(f => ({ ...f, bet_date: e.target.value }))}
                      required
                      className="text-sm h-9 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 lg:col-span-2">
                    <label className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Time / Evento</label>
                    <input
                      type="text"
                      placeholder="Ex: Flamengo, Liga dos Campeões…"
                      value={form.event}
                      onChange={e => setForm(f => ({ ...f, event: e.target.value }))}
                      required
                      className="text-sm h-9 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#CBD5E1] dark:placeholder:text-[#475569] focus:outline-none focus:border-[#2563EB] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Odd</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      placeholder="2.50"
                      value={form.odd}
                      onChange={e => setForm(f => ({ ...f, odd: e.target.value }))}
                      required
                      className="text-sm h-9 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#CBD5E1] dark:placeholder:text-[#475569] focus:outline-none focus:border-[#2563EB] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="50.00"
                      value={form.stake}
                      onChange={e => setForm(f => ({ ...f, stake: e.target.value }))}
                      required
                      className="text-sm h-9 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#CBD5E1] dark:placeholder:text-[#475569] focus:outline-none focus:border-[#2563EB] transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Resultado:</span>
                  <div className="flex gap-2">
                    {(['vitoria', 'derrota'] as BetResult[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, result: r }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          form.result === r
                            ? r === 'vitoria'
                              ? 'bg-[#F0FDF4] dark:bg-[#14532D] border-[#BBF7D0] dark:border-[#166534] text-[#16A34A] dark:text-[#4ADE80]'
                              : 'bg-[#FEF2F2] dark:bg-[#7F1D1D] border-[#FECACA] dark:border-[#991b1b] text-[#DC2626] dark:text-[#FCA5A5]'
                            : 'bg-white dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#CBD5E1] dark:hover:border-[#475569]'
                        }`}
                      >
                        {r === 'vitoria' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {RESULT_LABEL[r]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-4 py-2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-colors disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingBet ? 'Salvar Alterações' : 'Registrar Aposta'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Lucro Total"
          value={(stats.totalProfit >= 0 ? '+' : '') + formatBRL(stats.totalProfit)}
          sub={`${formatBRL(stats.totalStaked)} apostado`}
          Icon={DollarSign}
          color={stats.totalProfit >= 0 ? '#16A34A' : '#DC2626'}
          bg={stats.totalProfit >= 0 ? (dark ? '#14532D' : '#F0FDF4') : (dark ? '#7F1D1D' : '#FEF2F2')}
          border={stats.totalProfit >= 0 ? (dark ? '#166534' : '#BBF7D0') : (dark ? '#991b1b' : '#FECACA')}
        />
        <KPICard
          label="ROI"
          value={`${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%`}
          sub="Retorno sobre investimento"
          Icon={TrendingUp}
          color={stats.roi >= 0 ? '#16A34A' : '#DC2626'}
          bg={stats.roi >= 0 ? (dark ? '#14532D' : '#F0FDF4') : (dark ? '#7F1D1D' : '#FEF2F2')}
          border={stats.roi >= 0 ? (dark ? '#166534' : '#BBF7D0') : (dark ? '#991b1b' : '#FECACA')}
        />
        <KPICard
          label="Taxa de Acerto"
          value={`${stats.winRate.toFixed(1)}%`}
          sub={`${stats.wins}V ${stats.losses}D de ${stats.totalBets}`}
          Icon={Target}
          color={stats.winRate >= 50 ? '#2563EB' : '#D97706'}
          bg={stats.winRate >= 50 ? (dark ? '#1e3a5f' : '#EFF6FF') : (dark ? '#1E293B' : '#FFFBEB')}
          border={stats.winRate >= 50 ? (dark ? '#1e40af' : '#BFDBFE') : (dark ? '#854d0e' : '#FDE68A')}
        />
        <KPICard
          label="Apostas"
          value={String(stats.totalBets)}
          sub={`${stats.wins} vitórias · ${stats.losses} derrotas`}
          Icon={BarChart2}
          color={dark ? '#C4B5FD' : '#7C3AED'}
          bg={dark ? '#2e1065' : '#F5F3FF'}
          border={dark ? '#4c1d95' : '#DDD6FE'}
        />
      </div>

      {/* Sub-view container */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden">
        {/* Sub-view tabs */}
        <div className="flex border-b border-[#E2E8F0] dark:border-[#334155] overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {SUBVIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setSubView(id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                subView === id
                  ? 'text-[#2563EB]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {subView === id && (
                <motion.div
                  layoutId="betSubUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Sub-view content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={subView}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {subView === 'tabela' && (
              <BetsTableView
                dark={dark}
                bets={filteredBets}
                totalBets={bets.length}
                searchEvent={searchEvent}
                filterResult={filterResult}
                filterDateFrom={filterDateFrom}
                filterDateTo={filterDateTo}
                filterOddMin={filterOddMin}
                filterOddMax={filterOddMax}
                showFilters={showFilters}
                sortField={sortField}
                sortDir={sortDir}
                deletingId={deletingId}
                onSearchEvent={setSearchEvent}
                onFilterResult={setFilterResult}
                onFilterDateFrom={setFilterDateFrom}
                onFilterDateTo={setFilterDateTo}
                onFilterOddMin={setFilterOddMin}
                onFilterOddMax={setFilterOddMax}
                onToggleFilters={() => setShowFilters(f => !f)}
                onSort={handleSort}
                onEdit={handleEdit}
                onDelete={id => setConfirmDelete(id)}
              />
            )}
            {subView === 'graficos' && (
              <div className="p-5">
                <BetsChartsPanel bets={bets} simulationDays={simulationDays} initialBankroll={initialBankroll} />
              </div>
            )}
            {subView === 'rankings' && <RankingsView dark={dark} teamStats={teamStats} />}
            {subView === 'insights' && <InsightsView dark={dark} insights={insights} stats={stats} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmModal
        open={confirmDelete !== null}
        title="Excluir Aposta"
        description="Esta aposta será excluída permanentemente. Essa ação não pode ser desfeita."
        confirmLabel="Sim, excluir"
        confirmDanger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, Icon, color, bg, border,
}: {
  label: string; value: string; sub: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string; bg: string; border: string;
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: bg, borderColor: border }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">{label}</span>
      </div>
      <p className="text-xl font-black tabular-nums leading-none mb-1" style={{ color }}>{value}</p>
      <p className="text-[11px] text-[#94A3B8] dark:text-[#64748B] leading-snug">{sub}</p>
    </div>
  );
}

// ─── Bets Table View ──────────────────────────────────────────────────────────

interface TableViewProps {
  dark: boolean;
  bets: Bet[];
  totalBets: number;
  searchEvent: string;
  filterResult: '' | BetResult;
  filterDateFrom: string;
  filterDateTo: string;
  filterOddMin: string;
  filterOddMax: string;
  showFilters: boolean;
  sortField: SortField;
  sortDir: 'asc' | 'desc';
  deletingId: string | null;
  onSearchEvent: (v: string) => void;
  onFilterResult: (v: '' | BetResult) => void;
  onFilterDateFrom: (v: string) => void;
  onFilterDateTo: (v: string) => void;
  onFilterOddMin: (v: string) => void;
  onFilterOddMax: (v: string) => void;
  onToggleFilters: () => void;
  onSort: (f: SortField) => void;
  onEdit: (bet: Bet) => void;
  onDelete: (id: string) => void;
}

function BetsTableView({
  dark, bets, totalBets,
  searchEvent, filterResult, filterDateFrom, filterDateTo, filterOddMin, filterOddMax,
  showFilters, sortField, sortDir, deletingId,
  onSearchEvent, onFilterResult, onFilterDateFrom, onFilterDateTo, onFilterOddMin, onFilterOddMax,
  onToggleFilters, onSort, onEdit, onDelete,
}: TableViewProps) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2563EB]" /> : <ArrowDown className="w-3 h-3 text-[#2563EB]" />;
  };

  const thCls = 'bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155] px-4 py-3 text-left text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest whitespace-nowrap';
  const inputCls = 'h-8 text-xs px-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#CBD5E1] dark:placeholder:text-[#475569] focus:outline-none focus:border-[#2563EB] transition-colors';

  const hasFilters = !!(searchEvent || filterResult || filterDateFrom || filterDateTo || filterOddMin || filterOddMax);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9] dark:border-[#334155] flex-wrap">
        <div className="relative flex-1 min-w-40 max-w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Buscar time/evento…"
            value={searchEvent}
            onChange={e => onSearchEvent(e.target.value)}
            className={`w-full pl-8 pr-3 ${inputCls}`}
          />
        </div>
        <select
          value={filterResult}
          onChange={e => onFilterResult(e.target.value as '' | BetResult)}
          className={`${inputCls} pr-2`}
        >
          <option value="">Todos resultados</option>
          <option value="vitoria">Vitórias</option>
          <option value="derrota">Derrotas</option>
        </select>
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition-colors ${
            showFilters || hasFilters
              ? 'border-[#2563EB] text-[#2563EB] bg-[#EFF6FF] dark:bg-[#1e3a5f] dark:border-[#1e40af]'
              : 'border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#0F172A]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros
        </button>
        <span className="text-[11px] text-[#94A3B8] dark:text-[#64748B] ml-auto">
          {bets.length} de {totalBets}
        </span>
      </div>

      {/* Extended filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3 border-b border-[#F1F5F9] dark:border-[#334155]">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">De</label>
                <input type="date" value={filterDateFrom} onChange={e => onFilterDateFrom(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Até</label>
                <input type="date" value={filterDateTo} onChange={e => onFilterDateTo(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Odd mín</label>
                <input type="number" step="0.01" min="1" placeholder="1.00" value={filterOddMin} onChange={e => onFilterOddMin(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Odd máx</label>
                <input type="number" step="0.01" min="1" placeholder="10.00" value={filterOddMax} onChange={e => onFilterOddMax(e.target.value)} className={inputCls} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              {([
                { field: 'bet_date', label: 'Data' },
                { field: 'event',    label: 'Time / Evento' },
                { field: 'odd',      label: 'Odd' },
                { field: 'stake',    label: 'Valor' },
                { field: 'result',   label: 'Resultado' },
                { field: 'profit',   label: 'Lucro/Prej.' },
              ] as { field: SortField; label: string }[]).map(col => (
                <th key={col.field} className={thCls}>
                  <button
                    onClick={() => onSort(col.field)}
                    className="flex items-center gap-1 hover:text-[#0F172A] dark:hover:text-[#F1F5F9] transition-colors"
                  >
                    {col.label}
                    <SortIcon field={col.field} />
                  </button>
                </th>
              ))}
              <th className={thCls}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {bets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-14">
                  <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">Nenhuma aposta encontrada</p>
                  <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">Ajuste os filtros ou registre uma nova aposta</p>
                </td>
              </tr>
            ) : bets.map(bet => (
              <tr
                key={bet.id}
                className="border-b border-[#F1F5F9] dark:border-[#334155]/50 last:border-b-0 hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-[#94A3B8] dark:text-[#64748B] whitespace-nowrap">
                  {new Date(bet.bet_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 font-medium text-[#0F172A] dark:text-[#F1F5F9] max-w-[200px] truncate">
                  {bet.event}
                </td>
                <td className="px-4 py-3 tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                  {bet.odd.toFixed(2)}
                </td>
                <td className="px-4 py-3 tabular-nums text-[#0F172A] dark:text-[#F1F5F9] whitespace-nowrap">
                  {formatBRL(bet.stake)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    bet.result === 'vitoria'
                      ? 'bg-[#F0FDF4] dark:bg-[#14532D] text-[#16A34A] dark:text-[#4ADE80]'
                      : 'bg-[#FEF2F2] dark:bg-[#7F1D1D] text-[#DC2626] dark:text-[#FCA5A5]'
                  }`}>
                    {bet.result === 'vitoria'
                      ? <CheckCircle className="w-3 h-3" />
                      : <X className="w-3 h-3" />
                    }
                    {RESULT_LABEL[bet.result]}
                  </span>
                </td>
                <td className={`px-4 py-3 tabular-nums font-bold whitespace-nowrap ${
                  bet.profit >= 0 ? 'text-[#16A34A] dark:text-[#4ADE80]' : 'text-[#DC2626] dark:text-[#FCA5A5]'
                }`}>
                  {bet.profit >= 0 ? '+' : ''}{formatBRL(bet.profit)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(bet)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EFF6FF] dark:hover:bg-[#1e3a5f] hover:text-[#2563EB] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(bet.id)}
                      disabled={deletingId === bet.id}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D] hover:text-[#DC2626] transition-colors disabled:opacity-40"
                    >
                      {deletingId === bet.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Rankings View ────────────────────────────────────────────────────────────

function RankingsView({ dark, teamStats }: { dark: boolean; teamStats: TeamStats[] }) {
  const sorted = [...teamStats].sort((a, b) => b.totalProfit - a.totalProfit);
  const profitable = sorted.filter(t => t.totalProfit > 0);
  const losing = [...sorted].reverse().filter(t => t.totalProfit <= 0);

  return (
    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-[#D97706]" />
          <span className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Mais Lucrativos</span>
        </div>
        {profitable.length === 0 ? (
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B] py-4 text-center">Nenhum time lucrativo ainda</p>
        ) : (
          <div className="space-y-2">
            {profitable.slice(0, 10).map((t, i) => (
              <TeamRow key={t.team} rank={i + 1} team={t} dark={dark} type="profit" />
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          <span className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Com Prejuízo</span>
        </div>
        {losing.length === 0 ? (
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B] py-4 text-center">Nenhum time com prejuízo</p>
        ) : (
          <div className="space-y-2">
            {losing.slice(0, 10).map((t, i) => (
              <TeamRow key={t.team} rank={i + 1} team={t} dark={dark} type="loss" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamRow({ rank, team, dark, type }: { rank: number; team: TeamStats; dark: boolean; type: 'profit' | 'loss' }) {
  const isProfit = type === 'profit';
  const color = isProfit ? (dark ? '#4ADE80' : '#16A34A') : (dark ? '#FCA5A5' : '#DC2626');
  const bg = isProfit ? (dark ? '#14532D' : '#F0FDF4') : (dark ? '#7F1D1D' : '#FEF2F2');
  const border = isProfit ? (dark ? '#166534' : '#BBF7D0') : (dark ? '#991b1b' : '#FECACA');

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border"
      style={{ background: bg, borderColor: border }}
    >
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style={{ background: color }}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">{team.team}</p>
        <p className="text-[10px] text-[#94A3B8] dark:text-[#64748B]">{team.bets} apostas · {team.winRate.toFixed(0)}% acerto</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black tabular-nums" style={{ color }}>
          {team.totalProfit >= 0 ? '+' : ''}{formatBRL(team.totalProfit)}
        </p>
        <p className="text-[10px]" style={{ color }}>ROI {team.roi >= 0 ? '+' : ''}{team.roi.toFixed(1)}%</p>
      </div>
    </div>
  );
}

// ─── Insights View ────────────────────────────────────────────────────────────

function InsightsView({ dark, insights, stats }: { dark: boolean; insights: BetInsight[]; stats: BetStats }) {
  const TYPE_COLOR: Record<string, { text: string; bg: string; border: string }> = {
    success: { text: dark ? '#4ADE80' : '#16A34A', bg: dark ? '#14532D' : '#F0FDF4', border: dark ? '#166534' : '#BBF7D0' },
    warning: { text: dark ? '#FBBF24' : '#D97706', bg: dark ? '#1E293B' : '#FFFBEB', border: dark ? '#854d0e' : '#FDE68A' },
    info:    { text: dark ? '#93C5FD' : '#2563EB', bg: dark ? '#1e3a5f' : '#EFF6FF', border: dark ? '#1e40af' : '#BFDBFE' },
    danger:  { text: dark ? '#FCA5A5' : '#DC2626', bg: dark ? '#7F1D1D' : '#FEF2F2', border: dark ? '#991b1b' : '#FECACA' },
  };

  if (stats.totalBets < 2) {
    return (
      <div className="py-16 text-center">
        <Lightbulb className="w-10 h-10 text-[#CBD5E1] dark:text-[#475569] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">Registre pelo menos 2 apostas</p>
        <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">Os insights aparecem assim que houver dados suficientes.</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="py-16 text-center">
        <CheckCircle className="w-10 h-10 text-[#16A34A] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">Desempenho equilibrado</p>
        <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">Continue apostando para gerar mais insights.</p>
      </div>
    );
  }

  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {insights.map((ins, i) => {
        const c = TYPE_COLOR[ins.type];
        return (
          <div key={i} className="rounded-xl border p-4" style={{ background: c.bg, borderColor: c.border }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: c.text }}>{ins.title}</span>
              <span className="text-sm font-black tabular-nums flex-shrink-0" style={{ color: c.text }}>{ins.value}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: c.text + 'CC' }}>{ins.description}</p>
          </div>
        );
      })}
    </div>
  );
}
