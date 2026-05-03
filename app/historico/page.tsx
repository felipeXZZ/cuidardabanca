import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActivityLogs } from '@/lib/actions';
import Header from '@/components/Header';
import { Settings, Pin, RotateCcw, Trash2, Clock } from 'lucide-react';

const ACTION_CFG: Record<string, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bg: string; color: string;
}> = {
  settings_updated: { label: 'Configurações alteradas', Icon: Settings, bg: '#EFF6FF', color: '#1D4ED8' },
  status_updated:   { label: 'Status do dia atualizado', Icon: Pin,      bg: '#F0FDF4', color: '#15803D' },
  statuses_reset:   { label: 'Registros resetados',      Icon: RotateCcw, bg: '#FFFBEB', color: '#92400E' },
  full_reset:       { label: 'Reset completo',           Icon: Trash2,   bg: '#FEF2F2', color: '#DC2626' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function DetailsBadge({ details }: { details: Record<string, unknown> }) {
  const entries = Object.entries(details);
  if (entries.length === 0) return <span className="text-[#94A3B8] text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] px-2 py-0.5 text-xs text-[#475569] dark:text-[#94A3B8] rounded-full"
        >
          <span className="text-[#94A3B8] dark:text-[#64748B]">{k}:</span>
          <span className="font-semibold dark:text-[#CBD5E1]">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const logs = await getActivityLogs();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <Header user={{ id: user.id, email: user.email ?? '' }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">Histórico de Atividades</h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">Registro de todas as ações realizadas na conta</p>
          </div>
          <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-full px-3 py-1.5 shadow-sm">
            {logs.length} registro(s)
          </span>
        </div>

        {/* Empty state */}
        {logs.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-card p-12 text-center">
            <div className="w-12 h-12 bg-[#F1F5F9] dark:bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-[#CBD5E1] dark:text-[#475569]" />
            </div>
            <p className="text-[#64748B] dark:text-[#94A3B8] font-semibold mb-1">Nenhuma atividade registrada</p>
            <p className="text-[#94A3B8] dark:text-[#64748B] text-sm">As ações realizadas no sistema aparecerão aqui.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]" style={{ minWidth: 560 }}>
                <thead>
                  <tr>
                    {['Data / Hora', 'Ação', 'Detalhes'].map((h) => (
                      <th
                        key={h}
                        className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155] px-4 py-3 text-left text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const cfg = ACTION_CFG[log.action];
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-[#F1F5F9] dark:border-[#334155]/50 last:border-b-0 hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/30 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-[#94A3B8] dark:text-[#64748B]">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {cfg ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: cfg.bg, color: cfg.color }}
                            >
                              <cfg.Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          ) : (
                            <span className="text-[#64748B] dark:text-[#94A3B8]">{log.action}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <DetailsBadge details={log.details ?? {}} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
