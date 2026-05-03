'use client';

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import { useTheme } from '@/context/ThemeProvider';
import {
  computeCumulativeProfitData,
  computeProfitByPeriod,
  computeOddDistribution,
  type Bet,
} from '@/lib/bets';
import { formatBRL, type DayData } from '@/lib/bankroll';

interface Props {
  bets: Bet[];
  simulationDays: DayData[];
  initialBankroll: number;
}

export default function BetsChartsPanel({ bets, simulationDays, initialBankroll }: Props) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const gridColor = dark ? '#1E293B' : '#F1F5F9';
  const axisColor = dark ? '#475569' : '#94A3B8';
  const tooltipBg = { background: dark ? '#1E293B' : '#fff', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, borderRadius: 8, fontSize: 12 };

  const cumulativeData = computeCumulativeProfitData(bets);
  const periodData = computeProfitByPeriod(bets);
  const oddData = computeOddDistribution(bets);

  const comparisonData = cumulativeData.map((d, i) => {
    const simDay = simulationDays[Math.min(i, simulationDays.length - 1)];
    return {
      label: `#${d.index}`,
      real: parseFloat((initialBankroll + d.cumulative).toFixed(2)),
      simulado: simDay ? parseFloat(simDay.accumulated.toFixed(2)) : initialBankroll,
    };
  });

  if (bets.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Registre apostas para ver os gráficos</p>
      </div>
    );
  }

  const card = 'bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155]';
  const title = 'text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4 uppercase tracking-wider';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evolução do lucro acumulado */}
        <div className={card}>
          <p className={title}>Evolução do Lucro Real</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cumulativeData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="betCumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="index" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: 'aposta #', position: 'insideBottomRight', offset: -4, fill: axisColor, fontSize: 10 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${v}`} width={60} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any) => [formatBRL(Number(v)), 'Lucro acumulado']} labelFormatter={(l: any) => `Aposta #${l}`} contentStyle={tooltipBg} />
              <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="cumulative" stroke="#2563EB" strokeWidth={2} fill="url(#betCumGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lucro por período */}
        <div className={card}>
          <p className={title}>Lucro por Período</p>
          {periodData.length === 0 ? (
            <p className="text-xs text-[#94A3B8] py-8 text-center">Sem dados suficientes</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={periodData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${v}`} width={60} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => [formatBRL(Number(v)), 'Lucro']} contentStyle={tooltipBg} />
                <ReferenceLine y={0} stroke="#94A3B8" />
                <Bar dataKey="profit" name="Lucro" fill="#2563EB" radius={[4, 4, 0, 0]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuição de odds */}
        <div className={card}>
          <p className={title}>Distribuição de Odds</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={oddData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="range" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipBg} />
              <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
              <Bar dataKey="count" name="Apostas" fill="#7C3AED" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="wins" name="Vitórias" fill="#16A34A" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Real vs Simulação */}
        <div className={card}>
          <p className={title}>Real vs Simulação</p>
          {comparisonData.length === 0 ? (
            <p className="text-xs text-[#94A3B8] py-8 text-center">Sem dados para comparar</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={comparisonData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${v}`} width={60} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => formatBRL(Number(v))} contentStyle={tooltipBg} />
                <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
                <Line type="monotone" dataKey="real" stroke="#16A34A" strokeWidth={2} dot={false} name="Real" />
                <Line type="monotone" dataKey="simulado" stroke="#2563EB" strokeWidth={2} dot={false} strokeDasharray="5 3" name="Simulado" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
