'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { type DayData, formatBRL, formatPct } from '@/lib/bankroll';

interface KPICardsProps {
  days: DayData[];
  initialBankroll: number;
}

const PERIODS = [30, 60, 90, 120, 150, 180] as const;

const COLORS = [
  { text: '#2563EB', icon: '#2563EB', badge: '#EFF6FF', badgeDark: '#1e3a5f', badgeText: '#1D4ED8', border: '#BFDBFE' },
  { text: '#7C3AED', icon: '#7C3AED', badge: '#F5F3FF', badgeDark: '#2e1065', badgeText: '#6D28D9', border: '#DDD6FE' },
  { text: '#0891B2', icon: '#0891B2', badge: '#ECFEFF', badgeDark: '#164e63', badgeText: '#0E7490', border: '#A5F3FC' },
  { text: '#059669', icon: '#059669', badge: '#F0FDF4', badgeDark: '#14532D', badgeText: '#047857', border: '#A7F3D0' },
  { text: '#D97706', icon: '#D97706', badge: '#FFFBEB', badgeDark: '#78350F', badgeText: '#B45309', border: '#FDE68A' },
  { text: '#DC2626', icon: '#DC2626', badge: '#FEF2F2', badgeDark: '#7F1D1D', badgeText: '#B91C1C', border: '#FECACA' },
];

export default function KPICards({ days, initialBankroll }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      {PERIODS.map((period, i) => {
        const day = days[period - 1];
        const gain = initialBankroll > 0
          ? ((day.accumulated - initialBankroll) / initialBankroll) * 100
          : 0;
        const c = COLORS[i];

        return (
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35, ease: 'easeOut' }}
            whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }}
            className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-4 shadow-card cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wide">
                {period} dias
              </span>
              <TrendingUp style={{ color: c.icon }} className="w-3.5 h-3.5" />
            </div>
            <div className="text-[15px] font-bold tabular-nums mb-2" style={{ color: c.text }}>
              {formatBRL(day.accumulated)}
            </div>
            <span
              className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border"
              style={{ background: c.badge, color: c.badgeText, borderColor: c.border }}
            >
              +{formatPct(gain)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
