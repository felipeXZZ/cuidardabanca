'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_SETTINGS, type BankrollSettings, type DayStatus } from '@/lib/bankroll';

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<BankrollSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_SETTINGS;

  const { data } = await supabase
    .from('bankroll_settings')
    .select('initial_bankroll, daily_return, goal')
    .eq('user_id', user.id)
    .maybeSingle();

  return (data as BankrollSettings | null) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(
  initial_bankroll: number,
  daily_return: number,
  goal: number
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('bankroll_settings')
    .upsert(
      { user_id: user.id, initial_bankroll, daily_return, goal },
      { onConflict: 'user_id' }
    );

  if (error) throw new Error(error.message);

  await log(supabase, user.id, 'settings_updated', {
    initial_bankroll,
    daily_return,
    goal,
  });
  revalidatePath('/dashboard');
}

// ─── DAY STATUSES ────────────────────────────────────────────────────────────

export async function getDayStatuses(): Promise<Record<number, DayStatus>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from('day_statuses')
    .select('day, status')
    .eq('user_id', user.id);

  const map: Record<number, DayStatus> = {};
  data?.forEach((r) => {
    map[r.day] = r.status as DayStatus;
  });
  return map;
}

export async function setDayStatus(day: number, status: DayStatus): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('day_statuses')
    .upsert(
      { user_id: user.id, day, status },
      { onConflict: 'user_id,day' }
    );

  if (error) throw new Error(error.message);
  await log(supabase, user.id, 'status_updated', { day, status });
  revalidatePath('/dashboard');
}

export async function resetStatuses(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('day_statuses')
    .delete()
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  await log(supabase, user.id, 'statuses_reset', {});
  revalidatePath('/dashboard');
}

export async function resetAll(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  await Promise.all([
    supabase.from('day_statuses').delete().eq('user_id', user.id),
    supabase.from('bankroll_settings').delete().eq('user_id', user.id),
  ]);
  await log(supabase, user.id, 'full_reset', {});
  revalidatePath('/dashboard');
}

// ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('activity_logs')
    .select('id, action, details, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  return (data as ActivityLog[]) ?? [];
}

// ─── SESSIONS ────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  name: string;
  settings: BankrollSettings;
  statuses: Record<string, DayStatus>;
  created_at: string;
}

export async function getSessions(): Promise<Session[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('sessions')
    .select('id, name, settings, statuses, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (data as Session[]) ?? [];
}

export async function saveSession(
  name: string,
  settings: BankrollSettings,
  statuses: Record<number, DayStatus>
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, name, settings, statuses });

  if (error) throw new Error(error.message);
  await log(supabase, user.id, 'session_saved', { name });
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ─── INTERNAL HELPER ─────────────────────────────────────────────────────────

async function log(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  await supabase
    .from('activity_logs')
    .insert({ user_id: userId, action, details });
}
