'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine, Cell,
} from 'recharts';
import { BarChart2, TrendingUp, GitCompare } from 'lucide-react';
import { type DayData, formatBRL } from '@/lib/bankroll';
import { useTheme } from '@/context/ThemeProvider';

interface ChartsPanelProps {
  days: DayData[];
  initialBankroll: number;
  dailyReturn: number;
}

type Tab = 'evolution' | 'profit' | 'comparison';

const TABS: { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'evolution',  label: 'Evolução',    Icon: TrendingUp },
  { key: 'profit',     label: 'Lucros',      Icon: BarChart2 },
  { key: 'comparison', label: 'Cenários',    Icon: GitCompare },
];

function fmtShort(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-[#64748B] dark:text-[#94A3B8] mb-1.5">Dia {label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold" style={{ color: p.color }}>
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function ChartsPanel({ days, initialBankroll, dailyReturn }: ChartsPanelProps) {
  const [tab, setTab] = useState<Tab>('evolution');
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const grid  = dark ? '#334155' : '#F1F5F9';
  const axis  = dark ? '#64748B' : '#94A3B8';

  // Evolution data — all 180 days
  const evolData = days.map(d => ({
    day: d.day,
    Banca: parseFloat(d.accumulated.toFixed(2)),
    status: d.status,
  }));

  // Profit data — only days with a real status
  const profitData = days
    .filter(d => d.status !== 'pendente')
    .map(d => ({
      day: d.day,
      Lucro: parseFloat(d.profit.toFixed(2)),
      fill: d.status === 'derrota' ? '#EF4444' : '#22C55E',
    }));

  // Comparison data — compound at 3%, 5%, current% milestones
  const milestones = [30, 60, 90, 120, 150, 180];
  const compData = milestones.map(n => ({
    dia: `Dia ${n}`,
    '3%': parseFloat((initialBankroll * Math.pow(1.03, n)).toFixed(2)),
    '5%': parseFloat((initialBankroll * Math.pow(1.05, n)).toFixed(2)),
    [`${dailyReturn}%`]: parseFloat(days[n - 1].accumulated.toFixed(2)),
  }));

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Gráficos</h3>
        </div>
        <div className="flex gap-1 bg-[#F1F5F9] dark:bg-[#0F172A] p-1 rounded-lg">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === key
                  ? 'bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F1F5F9] shadow-sm'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="h-64">
        {tab === 'evolution' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis
                dataKey="day" stroke={axis} tick={{ fontSize: 10 }}
                tickFormatter={v => `${v}`}
                interval={29}
              />
              <YAxis stroke={axis} tick={{ fontSize: 10 }} tickFormatter={fmtShort} width={54} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="Banca" stroke="#2563EB"
                strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#2563EB' }}
              />
              <ReferenceLine
                y={days[days.length - 1]?.accumulated}
                stroke="#16A34A" strokeDasharray="4 4" strokeOpacity={0.5}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {tab === 'profit' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis
                dataKey="day" stroke={axis} tick={{ fontSize: 10 }}
                interval={Math.max(0, Math.floor(profitData.length / 10) - 1)}
              />
              <YAxis stroke={axis} tick={{ fontSize: 10 }} tickFormatter={fmtShort} width={54} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Lucro" radius={[3, 3, 0, 0]}>
                {profitData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {tab === 'comparison' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={compData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="dia" stroke={axis} tick={{ fontSize: 10 }} />
              <YAxis stroke={axis} tick={{ fontSize: 10 }} tickFormatter={fmtShort} width={54} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="3%"   stroke="#94A3B8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="5%"   stroke="#F59E0B" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey={`${dailyReturn}%`} stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {tab === 'evolution' && (
        <p className="text-[10px] text-[#94A3B8] dark:text-[#64748B] mt-2 text-center">
          Projeção de todos os 180 dias com base nas configurações atuais
        </p>
      )}
    </div>
  );
}
