'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, Upload, Loader2, Layers, Plus, Clock, Database } from 'lucide-react';
import { type BankrollSettings, type DayStatus, formatBRL } from '@/lib/bankroll';
import { getSessions, saveSession, deleteSession, type Session } from '@/lib/actions';

interface SessionsManagerProps {
  currentSettings: BankrollSettings;
  currentStatuses: Record<number, DayStatus>;
  onLoad: (settings: BankrollSettings, statuses: Record<number, DayStatus>) => void;
}

export default function SessionsManager({ currentSettings, currentStatuses, onLoad }: SessionsManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dbError, setDbError] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
      setDbError(false);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await saveSession(name.trim(), currentSettings, currentStatuses);
      setName('');
      await fetchSessions();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoad = (session: Session) => {
    const statuses: Record<number, DayStatus> = {};
    Object.entries(session.statuses).forEach(([k, v]) => {
      statuses[Number(k)] = v as DayStatus;
    });
    onLoad(session.settings as BankrollSettings, statuses);
  };

  const activeDaysCount = Object.values(currentStatuses).filter(
    s => s === 'vitoria' || s === 'derrota' || s === 'concluido'
  ).length;

  return (
    <div className="space-y-5">
      {/* Save current session */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Plus className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Salvar simulação atual</h3>
        </div>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
          Banca: <strong>{formatBRL(currentSettings.initial_bankroll)}</strong>
          &nbsp;·&nbsp;Retorno: <strong>{currentSettings.daily_return}%</strong>
          &nbsp;·&nbsp;Meta: <strong>{formatBRL(currentSettings.goal)}</strong>
          &nbsp;·&nbsp;<strong>{activeDaysCount}</strong> dias registrados
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Ex: Banca conservadora 3% — Abril 2025"
            className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-lg px-3 py-2 text-sm text-[#0F172A] dark:text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shadow-sm shadow-blue-500/20 whitespace-nowrap"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>

      {/* Sessions list */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9] dark:border-[#334155]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Simulações salvas</h3>
          </div>
          {!loading && !dbError && (
            <span className="text-[11px] font-medium text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-full px-2.5 py-0.5">
              {sessions.length} sessão(ões)
            </span>
          )}
        </div>

        <div className="p-5">
          {dbError ? (
            <div className="flex flex-col items-center py-8 text-center gap-3">
              <Database className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Tabela não encontrada</p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-xs">
                  Execute o SQL abaixo no Supabase para habilitar sessões:
                </p>
              </div>
              <pre className="text-left text-[10px] bg-[#0F172A] dark:bg-[#0F172A] text-[#4ADE80] rounded-xl p-4 w-full max-w-md overflow-x-auto">
{`create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  settings jsonb not null,
  statuses jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.sessions enable row level security;
create policy "user sessions" on public.sessions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`}
              </pre>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-[#94A3B8] animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-12 h-12 bg-[#F1F5F9] dark:bg-[#0F172A] rounded-full flex items-center justify-center mb-3">
                <Layers className="w-6 h-6 text-[#CBD5E1] dark:text-[#475569]" />
              </div>
              <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">Nenhuma simulação salva</p>
              <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">
                Salve sua configuração atual para carregar depois.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {sessions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12, scale: 0.97 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    className="flex items-center gap-3 p-4 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl hover:border-[#BFDBFE] dark:hover:border-[#1e40af] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">{s.name}</p>
                      <p className="text-[11px] text-[#94A3B8] dark:text-[#64748B] mt-0.5 flex flex-wrap items-center gap-x-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(s.created_at).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        <span>{formatBRL((s.settings as BankrollSettings).initial_bankroll)}</span>
                        <span>{(s.settings as BankrollSettings).daily_return}% / dia</span>
                        <span>Meta {formatBRL((s.settings as BankrollSettings).goal)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoad(s)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] dark:bg-[#1e3a5f] border border-[#BFDBFE] dark:border-[#1e40af] px-3 py-1.5 rounded-lg hover:bg-[#DBEAFE] dark:hover:bg-[#1e40af] transition-colors whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Carregar
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="flex items-center justify-center w-8 h-8 text-[#CBD5E1] dark:text-[#475569] hover:text-[#DC2626] dark:hover:text-[#FCA5A5] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === s.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
