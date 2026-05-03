'use client';

import { motion } from 'framer-motion';
import { Target, Trophy } from 'lucide-react';
import { formatBRL } from '@/lib/bankroll';

interface GoalProgressProps {
  current: number;
  goal: number;
  activeDays: number;
  daysToGoal: number | null;
}

export default function GoalProgress({ current, goal, activeDays, daysToGoal }: GoalProgressProps) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const reached = current >= goal;
  const remaining = Math.max(0, goal - current);

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${reached ? 'bg-[#F0FDF4] dark:bg-[#14532D]/30' : 'bg-[#EFF6FF] dark:bg-[#1e3a5f]'}`}>
            {reached
              ? <Trophy className="w-4 h-4 text-[#16A34A]" />
              : <Target className="w-4 h-4 text-[#2563EB]" />
            }
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Progresso da Meta</h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Meta: {formatBRL(goal)}</p>
          </div>
        </div>
        <span className={`text-2xl font-black tabular-nums ${reached ? 'text-[#16A34A]' : 'text-[#2563EB]'}`}>
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-[#F1F5F9] dark:bg-[#0F172A] rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: reached
              ? 'linear-gradient(90deg, #16A34A, #22C55E)'
              : 'linear-gradient(90deg, #2563EB, #60A5FA)',
          }}
        />
        {pct > 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="absolute inset-y-0 rounded-full opacity-40"
            style={{
              left: 0,
              width: `${pct}%`,
              background: 'linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.5))',
            }}
          />
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCell
          label="Banca atual"
          value={formatBRL(current)}
          highlight={reached}
        />
        <StatCell
          label={reached ? 'Meta superada' : 'Faltam'}
          value={reached ? '🎯' : formatBRL(remaining)}
        />
        <StatCell
          label={daysToGoal !== null ? 'Previsão' : 'Dias ativos'}
          value={daysToGoal !== null ? `~${daysToGoal}d` : `${activeDays}d`}
        />
      </div>

      {reached && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#BBF7D0] dark:border-[#166534] rounded-xl px-3 py-2"
        >
          <Trophy className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
          <span className="text-xs font-semibold text-[#14532D] dark:text-[#4ADE80]">
            Meta atingida! Banca atual supera o objetivo em {formatBRL(current - goal)}.
          </span>
        </motion.div>
      )}
    </div>
  );
}

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl px-3 py-2.5 text-center">
      <div className={`text-sm font-bold tabular-nums truncate ${highlight ? 'text-[#16A34A]' : 'text-[#0F172A] dark:text-[#F1F5F9]'}`}>
        {value}
      </div>
      <div className="text-[10px] text-[#94A3B8] mt-0.5 truncate">{label}</div>
    </div>
  );
}
