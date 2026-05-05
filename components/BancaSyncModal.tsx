'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingDown, TrendingUp, RefreshCw, RotateCcw, PlayCircle, Loader2 } from 'lucide-react';
import { formatBRL } from '@/lib/bankroll';
import { useTheme } from '@/context/ThemeProvider';

type Choice = 'continue' | 'sync' | 'reset';

interface Props {
  open: boolean;
  simulatedValue: number;
  realValue: number;
  syncDay: number;
  loading: boolean;
  onContinue: () => void;
  onSync: () => Promise<void>;
  onReset: () => Promise<void>;
}

export default function BancaSyncModal({
  open, simulatedValue, realValue, syncDay, loading, onContinue, onSync, onReset,
}: Props) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [selected, setSelected] = useState<Choice | null>(null);

  const diff = realValue - simulatedValue;
  const isPositive = diff >= 0;

  const handleConfirm = async () => {
    if (!selected) return;
    if (selected === 'continue') { onContinue(); return; }
    if (selected === 'sync') await onSync();
    if (selected === 'reset') await onReset();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onContinue}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E2E8F0] dark:border-[#334155] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#F1F5F9] dark:border-[#334155]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Ajuste de Banca
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Sua banca real está diferente da simulação
              </p>
            </div>
            <button
              onClick={onContinue}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Comparison */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A]">
            <div className="flex-1 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Simulação</p>
              <p className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] tabular-nums">
                {formatBRL(simulatedValue)}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${
                isPositive
                  ? 'bg-[#DCFCE7] dark:bg-[#14532D] text-[#15803D] dark:text-[#4ADE80]'
                  : 'bg-[#FEE2E2] dark:bg-[#7F1D1D] text-[#DC2626] dark:text-[#FCA5A5]'
              }`}
            >
              {isPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {isPositive ? '+' : ''}{formatBRL(diff)}
            </div>
            <div className="flex-1 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Real</p>
              <p className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] tabular-nums">
                {formatBRL(realValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="px-6 py-4 space-y-2.5">

          {/* Option 1 — Continuar */}
          <button
            onClick={() => setSelected('continue')}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selected === 'continue'
                ? 'border-[#CBD5E1] dark:border-[#475569] bg-[#F8FAFC] dark:bg-[#334155]'
                : 'border-[#E2E8F0] dark:border-[#334155] hover:border-[#CBD5E1] dark:hover:border-[#475569]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-[#0F172A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <PlayCircle className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  Continuar sem ajustar
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Mantém a simulação atual sem alterações
                </p>
              </div>
            </div>
          </button>

          {/* Option 2 — Sincronizar (recomendado) */}
          <button
            onClick={() => setSelected('sync')}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selected === 'sync'
                ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#1e3a5f]'
                : 'border-[#E2E8F0] dark:border-[#334155] hover:border-[#93C5FD] dark:hover:border-[#1e40af]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-[#1e3a5f] flex items-center justify-center flex-shrink-0 mt-0.5">
                <RefreshCw className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    Sincronizar banca
                  </p>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#DBEAFE] dark:bg-[#1e3a5f] border border-[#93C5FD] dark:border-[#1e40af] px-1.5 py-0.5 rounded-full">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Usa {formatBRL(realValue)} como base a partir do dia {syncDay}. Histórico anterior preservado.
                </p>
              </div>
            </div>
          </button>

          {/* Option 3 — Reset */}
          <button
            onClick={() => setSelected('reset')}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selected === 'reset'
                ? 'border-[#DC2626] bg-[#FEF2F2] dark:bg-[#7F1D1D]/40'
                : 'border-[#E2E8F0] dark:border-[#334155] hover:border-[#FCA5A5] dark:hover:border-[#7F1D1D]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] dark:bg-[#7F1D1D]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <RotateCcw className="w-4 h-4 text-[#DC2626] dark:text-[#FCA5A5]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  Resetar a partir da banca atual
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Inicia nova simulação com {formatBRL(realValue)}. Registros anteriores ficam no histórico.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Aplicando...' : 'Confirmar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
