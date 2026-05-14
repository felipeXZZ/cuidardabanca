import { type DayData, type DayStatus, formatBRL, formatPct } from './bankroll';

export interface Insight {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  value: string;
  description: string;
  icon: 'trending' | 'target' | 'streak' | 'calendar' | 'star' | 'alert';
}

export interface InsightSummary {
  activeDays: number;
  wins: number;
  losses: number;
  winRate: number;
  totalGrowthPct: number;
  currentBankroll: number;
  streak: { type: 'win' | 'loss' | 'none'; count: number };
  daysToGoal: number | null;
  bestDay: { day: number; profit: number } | null;
  last7Perf: number;
  insights: Insight[];
}

export function computeInsights(
  days: DayData[],
  goal: number,
  initialBankroll: number
): InsightSummary {
  const completed = days.filter(
    (d): d is DayData => d.status === 'vitoria' || d.status === 'derrota' || d.status === 'concluido'
  );
  const wins = completed.filter(d => d.status === 'vitoria' || d.status === 'concluido');
  const losses = completed.filter(d => d.status === 'derrota');
  const activeDays = completed.length;

  let currentBankroll = activeDays > 0 ? completed[activeDays - 1].accumulated : initialBankroll;
  const firstPending = days.find(d => d.status === 'pendente');
  if (firstPending?.adjustment?.type === 'sync') {
    currentBankroll = firstPending.adjustment.new_value;
  }
  const totalGrowthPct =
    initialBankroll > 0 ? ((currentBankroll - initialBankroll) / initialBankroll) * 100 : 0;
  const winRate = activeDays > 0 ? (wins.length / activeDays) * 100 : 0;
  const streak = getCurrentStreak(days);

  const bestDay =
    wins.length > 0
      ? wins.reduce((b, d) => (d.profit > b.profit ? d : b), wins[0])
      : null;

  const daysToGoal =
    currentBankroll < goal && activeDays >= 2
      ? estimateDaysToGoal(completed, currentBankroll, goal)
      : null;

  const last7 = completed.slice(-7);
  const last7Perf =
    last7.length >= 2
      ? ((last7[last7.length - 1].accumulated - last7[0].accumulated) / last7[0].accumulated) * 100
      : 0;

  const insights: Insight[] = [];

  if (activeDays === 0) {
    return { activeDays, wins: 0, losses: 0, winRate, totalGrowthPct, currentBankroll, streak, daysToGoal, bestDay, last7Perf, insights };
  }

  insights.push({
    type: totalGrowthPct >= 0 ? 'success' : 'danger',
    title: 'Crescimento Total',
    value: `+${formatPct(Math.abs(totalGrowthPct))}`,
    description: `De ${formatBRL(initialBankroll)} → ${formatBRL(currentBankroll)}`,
    icon: 'trending',
  });

  insights.push({
    type: winRate >= 60 ? 'success' : winRate >= 40 ? 'warning' : 'danger',
    title: 'Taxa de Vitória',
    value: formatPct(winRate),
    description: `${wins.length}V · ${losses.length}D em ${activeDays} dias`,
    icon: 'star',
  });

  if (streak.count >= 2) {
    insights.push({
      type: streak.type === 'win' ? 'success' : 'danger',
      title: streak.type === 'win' ? 'Sequência Positiva' : 'Sequência Negativa',
      value: `${streak.count} dias`,
      description: streak.type === 'win' ? 'Ótima consistência!' : 'Avalie sua estratégia',
      icon: 'streak',
    });
  }

  if (daysToGoal !== null) {
    insights.push({
      type: daysToGoal <= 30 ? 'success' : 'info',
      title: 'Previsão de Meta',
      value: `~${daysToGoal} dias`,
      description: `Faltam ${formatBRL(goal - currentBankroll)}`,
      icon: 'target',
    });
  } else if (currentBankroll >= goal) {
    insights.push({
      type: 'success',
      title: 'Meta Atingida!',
      value: formatBRL(currentBankroll),
      description: `Parabéns! Meta de ${formatBRL(goal)} superada.`,
      icon: 'target',
    });
  }

  if (bestDay) {
    insights.push({
      type: 'info',
      title: 'Melhor Dia',
      value: `Dia ${bestDay.day}`,
      description: `Lucro de ${formatBRL(bestDay.profit)}`,
      icon: 'star',
    });
  }

  if (last7.length >= 3) {
    insights.push({
      type: last7Perf >= 0 ? 'success' : 'warning',
      title: 'Últimos 7 Dias',
      value: `${last7Perf >= 0 ? '+' : ''}${formatPct(last7Perf)}`,
      description: last7Perf >= 0 ? 'Tendência positiva' : 'Tendência negativa',
      icon: 'calendar',
    });
  }

  return { activeDays, wins: wins.length, losses: losses.length, winRate, totalGrowthPct, currentBankroll, streak, daysToGoal, bestDay, last7Perf, insights };
}

function getCurrentStreak(days: DayData[]): { type: 'win' | 'loss' | 'none'; count: number } {
  const completed = [...days].filter(d => d.status !== 'pendente').reverse();
  if (completed.length === 0) return { type: 'none', count: 0 };

  const firstIsWin = completed[0].status === 'vitoria' || completed[0].status === 'concluido';
  let count = 0;
  for (const d of completed) {
    const isWin = d.status === 'vitoria' || d.status === 'concluido';
    if (isWin === firstIsWin) count++;
    else break;
  }
  return { type: firstIsWin ? 'win' : 'loss', count };
}

function estimateDaysToGoal(
  completed: DayData[],
  current: number,
  goal: number
): number | null {
  if (completed.length < 2) return null;
  const first = completed[0].accumulated;
  const last = completed[completed.length - 1].accumulated;
  const avgGrowth = (last - first) / completed.length;
  if (avgGrowth <= 0) return null;
  return Math.ceil((goal - current) / avgGrowth);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _DayStatus = DayStatus;
