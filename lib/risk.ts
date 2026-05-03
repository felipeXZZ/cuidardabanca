import { type DayData } from './bankroll';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskMetrics {
  level: RiskLevel;
  score: number;
  maxDrawdown: number;
  longestLossStreak: number;
  longestWinStreak: number;
  recommendation: string;
  zoneLabel: string;
}

const ZONES: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low:      { label: 'Conservador',  color: '#16A34A', bg: '#F0FDF4' },
  medium:   { label: 'Moderado',     color: '#D97706', bg: '#FFFBEB' },
  high:     { label: 'Agressivo',    color: '#EA580C', bg: '#FFF7ED' },
  critical: { label: 'Crítico',      color: '#DC2626', bg: '#FEF2F2' },
};

export const RISK_ZONES = ZONES;

export function computeRisk(days: DayData[], dailyReturn: number): RiskMetrics {
  const completed = days.filter(d => d.status !== 'pendente');

  let maxBankroll = 0;
  let maxDrawdown = 0;
  for (const d of completed) {
    if (d.accumulated > maxBankroll) maxBankroll = d.accumulated;
    const dd = maxBankroll > 0 ? ((maxBankroll - d.accumulated) / maxBankroll) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  let longestLoss = 0, longestWin = 0, curLoss = 0, curWin = 0;
  for (const d of completed) {
    if (d.status === 'derrota') {
      curLoss++; curWin = 0;
      if (curLoss > longestLoss) longestLoss = curLoss;
    } else {
      curWin++; curLoss = 0;
      if (curWin > longestWin) longestWin = curWin;
    }
  }

  // Base score from daily return
  let score =
    dailyReturn <= 2  ? 10 :
    dailyReturn <= 3  ? 20 :
    dailyReturn <= 5  ? 38 :
    dailyReturn <= 8  ? 62 :
    dailyReturn <= 15 ? 80 : 95;

  score = Math.min(100, score + maxDrawdown * 0.4 + longestLoss * 2.5);

  const level: RiskLevel =
    score >= 75 ? 'critical' :
    score >= 50 ? 'high' :
    score >= 25 ? 'medium' : 'low';

  const recommendation =
    level === 'low'      ? 'Estratégia conservadora. Excelente para crescimento consistente.' :
    level === 'medium'   ? 'Risco moderado. Monitore sequências de perda com atenção.' :
    level === 'high'     ? 'Alto risco. Considere reduzir para 3–5% ao dia.' :
                           'Risco crítico. Alta probabilidade de perda total da banca.';

  return {
    level, score,
    maxDrawdown,
    longestLossStreak: longestLoss,
    longestWinStreak: longestWin,
    recommendation,
    zoneLabel: ZONES[level].label,
  };
}
