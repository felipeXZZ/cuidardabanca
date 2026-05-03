'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp, Target, Zap, Calendar, Star, AlertTriangle,
  Trophy, Flame,
} from 'lucide-react';
import { type InsightSummary } from '@/lib/insights';

const ICON_MAP = {
  trending: TrendingUp,
  target: Target,
  streak: Flame,
  calendar: Calendar,
  star: Star,
  alert: AlertTriangle,
};

const TYPE_STYLES = {
  success: {
    card: 'bg-[#F0FDF4] dark:bg-[#14532D]/20 border-[#BBF7D0] dark:border-[#166534]',
    icon: 'bg-[#DCFCE7] dark:bg-[#14532D]/40 text-[#16A34A]',
    value: 'text-[#14532D] dark:text-[#4ADE80]',
    title: 'text-[#15803D] dark:text-[#86EFAC]',
    desc: 'text-[#166534] dark:text-[#4ADE80]/70',
  },
  warning: {
    card: 'bg-[#FFFBEB] dark:bg-[#1E293B] border-[#FDE68A] dark:border-[#F59E0B]/25',
    icon: 'bg-[#FEF3C7] dark:bg-[#F59E0B]/10 text-[#D97706] dark:text-[#FBBF24]',
    value: 'text-[#92400E] dark:text-[#FBBF24]',
    title: 'text-[#B45309] dark:text-[#FBBF24]',
    desc: 'text-[#92400E] dark:text-[#94A3B8]',
  },
  info: {
    card: 'bg-[#EFF6FF] dark:bg-[#1e3a5f]/50 border-[#BFDBFE] dark:border-[#1e40af]',
    icon: 'bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#2563EB]',
    value: 'text-[#1D4ED8] dark:text-[#60A5FA]',
    title: 'text-[#1D4ED8] dark:text-[#93C5FD]',
    desc: 'text-[#1e40af] dark:text-[#60A5FA]/70',
  },
  danger: {
    card: 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border-[#FECACA] dark:border-[#991B1B]',
    icon: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/40 text-[#DC2626]',
    value: 'text-[#7F1D1D] dark:text-[#FCA5A5]',
    title: 'text-[#B91C1C] dark:text-[#FCA5A5]',
    desc: 'text-[#7F1D1D] dark:text-[#FCA5A5]/70',
  },
};

interface InsightsPanelProps {
  summary: InsightSummary;
}

export default function InsightsPanel({ summary }: InsightsPanelProps) {
  const { insights, activeDays } = summary;

  if (activeDays === 0) {
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-6 shadow-sm">
        <SectionHeader />
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-[#F1F5F9] dark:bg-[#0F172A] rounded-full flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6 text-[#CBD5E1] dark:text-[#475569]" />
          </div>
          <p className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">Nenhum dia registrado ainda</p>
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">Marque o status dos dias para ver os insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-5 shadow-sm">
      <SectionHeader count={insights.length} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
        {insights.map((ins, i) => {
          const styles = TYPE_STYLES[ins.type];
          const Icon = ICON_MAP[ins.icon];
          return (
            <motion.div
              key={ins.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`flex items-start gap-3 p-3.5 rounded-xl border ${styles.card}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${styles.title}`}>
                  {ins.title}
                </div>
                <div className={`text-base font-black mt-0.5 tabular-nums ${styles.value}`}>
                  {ins.value}
                </div>
                <div className={`text-[11px] mt-0.5 ${styles.desc}`}>
                  {ins.description}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader({ count }: { count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#2563EB]" />
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Insights da sua banca</h3>
      </div>
      {count !== undefined && (
        <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-full px-2.5 py-0.5">
          {count} insights
        </span>
      )}
    </div>
  );
}
