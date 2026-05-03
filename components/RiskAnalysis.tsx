'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, TrendingDown, Flame, Shield } from 'lucide-react';
import { type RiskMetrics } from '@/lib/risk';
import { useTheme } from '@/context/ThemeProvider';

interface RiskAnalysisProps {
  metrics: RiskMetrics;
  dailyReturn: number;
}

const LEVEL_CONFIG = {
  low: {
    bar: 'bg-[#22C55E]',
    track: 'bg-[#DCFCE7] dark:bg-[#14532D]/30',
    color: '#16A34A',
    bgLight: '#F0FDF4', bgDark: '#0d2618',
    borderLight: '#BBF7D0', borderDark: '#166534',
    textLight: '#14532D', textDark: '#4ADE80',
  },
  medium: {
    bar: 'bg-[#F59E0B]',
    track: 'bg-[#FEF3C7] dark:bg-[#78350F]/30',
    color: '#D97706',
    bgLight: '#FFFBEB', bgDark: '#1c1407',
    borderLight: '#FDE68A', borderDark: '#92400E',
    textLight: '#92400E', textDark: '#FCD34D',
  },
  high: {
    bar: 'bg-[#EA580C]',
    track: 'bg-[#FFF7ED] dark:bg-[#7C2D12]/30',
    color: '#EA580C',
    bgLight: '#FFF7ED', bgDark: '#1c0f07',
    borderLight: '#FED7AA', borderDark: '#9A3412',
    textLight: '#9A3412', textDark: '#FB923C',
  },
  critical: {
    bar: 'bg-[#DC2626]',
    track: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/30',
    color: '#DC2626',
    bgLight: '#FEF2F2', bgDark: '#1c0707',
    borderLight: '#FECACA', borderDark: '#991B1B',
    textLight: '#7F1D1D', textDark: '#FCA5A5',
  },
};

export default function RiskAnalysis({ metrics, dailyReturn }: RiskAnalysisProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const lc = LEVEL_CONFIG[metrics.level];
  const bg     = dark ? lc.bgDark     : lc.bgLight;
  const border = dark ? lc.borderDark : lc.borderLight;
  const txt    = dark ? lc.textDark   : lc.textLight;
  const safeZone = dailyReturn >= 3 && dailyReturn <= 5;

  const ZONES = [
    { label: '3–5%', range: '3–5%', isSafe: true, isActive: safeZone && dailyReturn !== 0 },
    {
      label: `${dailyReturn}%`,
      range: 'Seu retorno',
      isSafe: false,
      isActive: true,
      isUser: true,
    },
    { label: '>5%', range: 'Alto risco', isSafe: false, isActive: false },
  ];

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Análise de Risco</h3>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{ background: bg, color: lc.color, borderColor: border }}
        >
          {metrics.zoneLabel}
        </span>
      </div>

      {/* Risk score bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">Score de risco</span>
          <span className="text-xs font-bold tabular-nums" style={{ color: lc.color }}>
            {Math.round(metrics.score)}/100
          </span>
        </div>
        <div className={`h-2.5 rounded-full overflow-hidden ${lc.track}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.score}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            className={`h-full rounded-full ${lc.bar}`}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[#94A3B8] dark:text-[#64748B]">Conservador</span>
          <span className="text-[10px] text-[#94A3B8] dark:text-[#64748B]">Crítico</span>
        </div>
      </div>

      {/* Zone pills */}
      <div className="flex gap-1 mb-4">
        {ZONES.map((z, i) => {
          const isUser = 'isUser' in z && z.isUser;
          const pillBg   = isUser ? bg : (dark ? '#0F172A' : '#F8FAFC');
          const pillBord = isUser ? border : (dark ? '#334155' : '#E2E8F0');
          const pillTxt  = isUser ? lc.color : (dark ? '#64748B' : '#94A3B8');
          const pillSub  = isUser ? txt : (dark ? '#475569' : '#CBD5E1');
          return (
            <div
              key={i}
              className="flex-1 rounded-lg px-2 py-2 text-center"
              style={{ background: pillBg, border: `1px solid ${pillBord}` }}
            >
              <div className="text-[11px] font-bold" style={{ color: pillTxt }}>{z.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: pillSub }}>{z.range}</div>
            </div>
          );
        })}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <RiskStat
          icon={<TrendingDown className="w-3.5 h-3.5" />}
          label="Max Drawdown"
          value={`${metrics.maxDrawdown.toFixed(1)}%`}
          color={metrics.maxDrawdown > 20 ? '#DC2626' : metrics.maxDrawdown > 10 ? '#D97706' : '#16A34A'}
          dark={dark}
        />
        <RiskStat
          icon={<Flame className="w-3.5 h-3.5" />}
          label="Sequência perdas"
          value={`${metrics.longestLossStreak}d`}
          color={metrics.longestLossStreak >= 5 ? '#DC2626' : metrics.longestLossStreak >= 3 ? '#D97706' : '#16A34A'}
          dark={dark}
        />
        <RiskStat
          icon={<Shield className="w-3.5 h-3.5" />}
          label="Sequência wins"
          value={`${metrics.longestWinStreak}d`}
          color="#2563EB"
          dark={dark}
        />
        <RiskStat
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
          label="Retorno diário"
          value={`${dailyReturn}%`}
          color={lc.color}
          dark={dark}
        />
      </div>

      {/* Recommendation */}
      <div
        className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
        style={{ background: bg, color: txt, border: `1px solid ${border}` }}
      >
        {metrics.recommendation}
      </div>
    </div>
  );
}

function RiskStat({ icon, label, value, color, dark }: {
  icon: React.ReactNode; label: string; value: string; color: string; dark: boolean;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: dark ? '#0F172A' : '#F8FAFC' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-medium text-[#64748B] dark:text-[#94A3B8] truncate">{label}</span>
      </div>
      <div className="text-sm font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
