export type DayStatus = 'pendente' | 'vitoria' | 'derrota' | 'concluido';

export interface DayData {
  day: number;
  investment: number;
  dailyReturn: number;
  profit: number;
  accumulated: number;
  status: DayStatus;
}

export interface BankrollSettings {
  initial_bankroll: number;
  daily_return: number;
  goal: number;
}

export const DEFAULT_SETTINGS: BankrollSettings = {
  initial_bankroll: 1000,
  daily_return: 2,
  goal: 10000,
};

export function calculateBankroll(
  initialBankroll: number,
  dailyReturn: number,
  statuses: Record<number, DayStatus>
): DayData[] {
  const rows: DayData[] = [];
  let banca = Math.max(0, initialBankroll);
  const r = dailyReturn / 100;

  for (let i = 1; i <= 180; i++) {
    const investment = banca;
    const status = statuses[i] ?? 'pendente';
    // derrota = dia flat (sem crescimento); todos os outros compõem
    const profit = status === 'derrota' ? 0 : investment * r;
    const accumulated = investment + profit;
    banca = accumulated;
    rows.push({ day: i, investment, dailyReturn, profit, accumulated, status });
  }
  return rows;
}

export function formatBRL(value: number): string {
  const abs = Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (value < 0 ? '-R$ ' : 'R$ ') + abs;
}

export function formatPct(value: number): string {
  return (
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + '%'
  );
}
