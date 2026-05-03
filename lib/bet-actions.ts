'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Bet, BetResult } from './bets';

export async function getBets(): Promise<Bet[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', user.id)
    .order('bet_date', { ascending: false })
    .order('created_at', { ascending: false });

  return (data as Bet[]) ?? [];
}

export async function addBet(
  bet_date: string,
  event: string,
  odd: number,
  stake: number,
  result: BetResult,
  profit: number,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('bets')
    .insert({ user_id: user.id, bet_date, event, odd, stake, result, profit });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}

export async function updateBet(
  id: string,
  bet_date: string,
  event: string,
  odd: number,
  stake: number,
  result: BetResult,
  profit: number,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('bets')
    .update({ bet_date, event, odd, stake, result, profit })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}

export async function deleteBet(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('bets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}
