export type BetResult = 'vitoria' | 'derrota';

export interface Bet {
  id: string;
  user_id?: string;
  bet_date: string;
  event: string;
  odd: number;
  stake: number;
  result: BetResult;
  profit: number;
  created_at: string;
  updated_at: string;
}

export interface BetFormData {
  bet_date: string;
  event: string;
  odd: string;
  stake: string;
  result: BetResult;
}

export const EMPTY_FORM: BetFormData = {
  bet_date: new Date().toISOString().slice(0, 10),
  event: '',
  odd: '',
  stake: '',
  result: 'vitoria',
};

export interface BetStats {
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  totalStaked: number;
  roi: number;
}

export interface TeamStats {
  team: string;
  bets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  totalStaked: number;
  roi: number;
}

export interface BetInsight {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  value: string;
  description: string;
}

export function calculateProfit(odd: number, stake: number, result: BetResult): number {
  return result === 'vitoria'
    ? parseFloat(((odd - 1) * stake).toFixed(2))
    : -stake;
}

export function computeBetStats(bets: Bet[]): BetStats {
  const totalBets = bets.length;
  const wins = bets.filter(b => b.result === 'vitoria').length;
  const losses = bets.filter(b => b.result === 'derrota').length;
  const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
  const totalProfit = bets.reduce((s, b) => s + b.profit, 0);
  const totalStaked = bets.reduce((s, b) => s + b.stake, 0);
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  return { totalBets, wins, losses, winRate, totalProfit, totalStaked, roi };
}

export function computeTeamStats(bets: Bet[]): TeamStats[] {
  const map = new Map<string, Bet[]>();
  bets.forEach(b => {
    const arr = map.get(b.event) ?? [];
    arr.push(b);
    map.set(b.event, arr);
  });
  return Array.from(map.entries()).map(([team, tb]) => {
    const wins = tb.filter(b => b.result === 'vitoria').length;
    const losses = tb.filter(b => b.result === 'derrota').length;
    const betsCount = tb.length;
    const winRate = betsCount > 0 ? (wins / betsCount) * 100 : 0;
    const totalProfit = tb.reduce((s, b) => s + b.profit, 0);
    const totalStaked = tb.reduce((s, b) => s + b.stake, 0);
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
    return { team, bets: betsCount, wins, losses, winRate, totalProfit, totalStaked, roi };
  });
}

export function computeCumulativeProfitData(
  bets: Bet[]
): { index: number; date: string; profit: number; cumulative: number }[] {
  const sorted = [...bets].sort(
    (a, b) => a.bet_date.localeCompare(b.bet_date) || a.created_at.localeCompare(b.created_at)
  );
  let cum = 0;
  return sorted.map((b, i) => {
    cum += b.profit;
    return { index: i + 1, date: b.bet_date, profit: b.profit, cumulative: cum };
  });
}

export function computeProfitByPeriod(
  bets: Bet[]
): { period: string; label: string; profit: number; bets: number }[] {
  const map = new Map<string, { profit: number; bets: number }>();
  bets.forEach(b => {
    const period = b.bet_date.slice(0, 7);
    const entry = map.get(period) ?? { profit: 0, bets: 0 };
    entry.profit += b.profit;
    entry.bets += 1;
    map.set(period, entry);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({
      period,
      label: new Date(period + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      ...data,
    }));
}

export function computeOddDistribution(
  bets: Bet[]
): { range: string; count: number; wins: number; winRate: number }[] {
  const ranges = [
    { label: '1.0–1.5', min: 1.0, max: 1.5 },
    { label: '1.5–2.0', min: 1.5, max: 2.0 },
    { label: '2.0–2.5', min: 2.0, max: 2.5 },
    { label: '2.5–3.0', min: 2.5, max: 3.0 },
    { label: '3.0+', min: 3.0, max: Infinity },
  ];
  return ranges.map(r => {
    const inRange = bets.filter(b => b.odd >= r.min && b.odd < r.max);
    const wins = inRange.filter(b => b.result === 'vitoria').length;
    const winRate = inRange.length > 0 ? (wins / inRange.length) * 100 : 0;
    return { range: r.label, count: inRange.length, wins, winRate };
  });
}

export function computeBetInsights(bets: Bet[]): BetInsight[] {
  if (bets.length < 2) return [];
  const insights: BetInsight[] = [];
  const stats = computeBetStats(bets);

  if (stats.winRate >= 65) {
    insights.push({
      type: 'success',
      title: 'Alta taxa de acerto',
      value: `${stats.winRate.toFixed(1)}%`,
      description: 'Você está acertando mais de 65% das apostas. Excelente desempenho!',
    });
  } else if (stats.winRate < 40 && stats.totalBets >= 5) {
    insights.push({
      type: 'danger',
      title: 'Taxa de acerto baixa',
      value: `${stats.winRate.toFixed(1)}%`,
      description: 'Menos de 40% de acerto. Revise sua estratégia de seleção.',
    });
  }

  if (stats.roi > 10) {
    insights.push({
      type: 'success',
      title: 'ROI excelente',
      value: `+${stats.roi.toFixed(1)}%`,
      description: 'Retorno sobre investimento acima de 10%.',
    });
  } else if (stats.roi < -10 && stats.totalBets >= 5) {
    insights.push({
      type: 'danger',
      title: 'ROI muito negativo',
      value: `${stats.roi.toFixed(1)}%`,
      description: 'Você está perdendo mais de 10% do capital apostado.',
    });
  }

  const teamStats = computeTeamStats(bets);
  if (teamStats.length > 0) {
    const best = [...teamStats].sort((a, b) => b.totalProfit - a.totalProfit)[0];
    if (best.totalProfit > 0) {
      const name = best.team.length > 16 ? best.team.slice(0, 16) + '…' : best.team;
      insights.push({
        type: 'success',
        title: 'Time mais lucrativo',
        value: name,
        description: `Lucro de R$ ${best.totalProfit.toFixed(2)} em ${best.bets} aposta${best.bets > 1 ? 's' : ''}.`,
      });
    }
    const worst = [...teamStats].sort((a, b) => a.totalProfit - b.totalProfit)[0];
    if (worst.totalProfit < 0) {
      const name = worst.team.length > 16 ? worst.team.slice(0, 16) + '…' : worst.team;
      insights.push({
        type: 'warning',
        title: 'Evite esse time/evento',
        value: name,
        description: `Prejuízo de R$ ${Math.abs(worst.totalProfit).toFixed(2)} em ${worst.bets} aposta${worst.bets > 1 ? 's' : ''}.`,
      });
    }
  }

  const oddDist = computeOddDistribution(bets);
  const bestRange = oddDist.filter(r => r.count >= 3).sort((a, b) => b.winRate - a.winRate)[0];
  if (bestRange) {
    insights.push({
      type: 'info',
      title: 'Odds mais eficientes',
      value: bestRange.range,
      description: `${bestRange.winRate.toFixed(1)}% de acerto em ${bestRange.count} apostas nessa faixa.`,
    });
  }

  const sorted = [...bets].sort((a, b) => b.bet_date.localeCompare(a.bet_date));
  let winStreak = 0;
  for (const b of sorted) { if (b.result === 'vitoria') winStreak++; else break; }
  if (winStreak >= 3) {
    insights.push({
      type: 'success',
      title: 'Sequência de vitórias',
      value: `${winStreak} seguidas`,
      description: 'Ótima fase! Continue com disciplina e gestão de banca.',
    });
  }

  let lossStreak = 0;
  for (const b of sorted) { if (b.result === 'derrota') lossStreak++; else break; }
  if (lossStreak >= 3) {
    insights.push({
      type: 'danger',
      title: 'Sequência de derrotas',
      value: `${lossStreak} seguidas`,
      description: 'Considere pausar e revisar sua estratégia de seleção.',
    });
  }

  return insights;
}
