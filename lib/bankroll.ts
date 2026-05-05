export type DayStatus = 'pendente' | 'vitoria' | 'derrota' | 'concluido';

export interface BankrollAdjustment {
  id?: string;
  day: number;
  old_value: number;
  new_value: number;
  type: 'sync' | 'reset';
  created_at?: string;
}

export interface DayData {
  day: number;
  investment: number;
  dailyReturn: number;
  profit: number;
  accumulated: number;
  status: DayStatus;
  adjustment?: BankrollAdjustment;
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
  statuses: Record<number, DayStatus>,
  adjustments: BankrollAdjustment[] = []
): DayData[] {
  const adjustmentMap = new Map(adjustments.map(a => [a.day, a]));
  const rows: DayData[] = [];
  let banca = Math.max(0, initialBankroll);
  const r = dailyReturn / 100;

  for (let i = 1; i <= 180; i++) {
    const adjustment = adjustmentMap.get(i);
    if (adjustment) banca = adjustment.new_value;

    const investment = banca;
    const status = statuses[i] ?? 'pendente';
    // derrota = dia flat (sem crescimento); todos os outros compõem
    const profit = status === 'derrota' ? 0 : investment * r;
    const accumulated = investment + profit;
    banca = accumulated;
    rows.push({ day: i, investment, dailyReturn, profit, accumulated, status, adjustment });
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
