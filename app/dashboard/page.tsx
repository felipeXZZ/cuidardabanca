import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSettings, getDayStatuses } from '@/lib/actions';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [settings, statuses] = await Promise.all([
    getSettings(),
    getDayStatuses(),
  ]);

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? '' }}
      initialSettings={settings}
      initialStatuses={statuses}
    />
  );
}
