'use client';

import { useState } from 'react';
import { Save, RotateCcw, Trash2, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import type { BankrollSettings } from '@/lib/bankroll';

interface SettingsPanelProps {
  settings: BankrollSettings;
  onChange: (field: keyof BankrollSettings, value: number) => void;
  onSave: () => Promise<void>;
  onResetStatuses: () => void;
  onResetAll: () => void;
  saving: boolean;
  saveMsg: string | null;
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}
function parsePtBR(s: string): number {
  const cleaned = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function FormattedInput({
  value, onChange, isPercent, className,
}: {
  value: number;
  onChange: (v: number) => void;
  isPercent?: boolean;
  className?: string;
}) {
  const fmt = (n: number) => isPercent ? fmtPct(n) : fmtBRL(n);
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');

  const displayed = editing ? raw : fmt(value);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayed}
      onFocus={(e) => {
        setRaw(value === 0 ? '' : String(value).replace('.', ','));
        setEditing(true);
        setTimeout(() => e.target.select(), 0);
      }}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onChange(parsePtBR(raw));
      }}
      className={className}
    />
  );
}

const FIELDS: {
  label: string;
  field: keyof BankrollSettings;
  affix: string;
  isPercent?: boolean;
}[] = [
  { label: 'Banca Inicial',  field: 'initial_bankroll', affix: 'R$'  },
  { label: 'Retorno Diário', field: 'daily_return',     affix: '%', isPercent: true },
  { label: 'Meta',           field: 'goal',             affix: 'R$'  },
];

export default function SettingsPanel({
  settings, onChange, onSave, onResetStatuses, onResetAll, saving,
}: SettingsPanelProps) {
  const showDanger = settings.daily_return > 5;

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-card p-5 mb-6">
      <div className="flex flex-wrap gap-5 items-end">
        {/* Fields */}
        <div className="flex flex-wrap gap-4 items-end flex-1">
          {FIELDS.map(({ label, field, affix, isPercent }) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wide">
                {label}
                <span className="ml-1.5 text-[#94A3B8] font-normal normal-case">({affix})</span>
              </label>
              <FormattedInput
                value={settings[field]}
                onChange={(v) => onChange(field, v)}
                isPercent={isPercent}
                className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-lg px-3 py-2 text-sm text-[#0F172A] dark:text-[#F1F5F9] w-40 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 shadow-sm shadow-blue-500/20"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              : <><Save className="w-4 h-4" /> Salvar</>
            }
          </button>

          <button
            onClick={onResetStatuses}
            disabled={saving}
            className="flex items-center gap-2 bg-white dark:bg-[#1E293B] hover:bg-[#FFFBEB] dark:hover:bg-[#F59E0B]/10 text-[#92400E] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#F59E0B]/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:block">Resetar Registros</span>
            <span className="sm:hidden">Registros</span>
          </button>

          <button
            onClick={onResetAll}
            disabled={saving}
            className="flex items-center gap-2 bg-white dark:bg-transparent hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 text-[#DC2626] dark:text-[#FCA5A5] border border-[#FECACA] dark:border-[#991B1B] px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:block">Resetar Tudo</span>
            <span className="sm:hidden">Tudo</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-start gap-2 bg-[#EFF6FF] dark:bg-[#1e3a5f]/40 border border-[#BFDBFE] dark:border-[#1e40af] rounded-lg px-3 py-2 text-xs text-[#1D4ED8] dark:text-[#93C5FD]">
          <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span><strong>Recomendado:</strong> retorno diário entre 3% e 5% para gestão saudável da banca.</span>
        </div>

        {showDanger && (
          <div className="flex items-start gap-2 bg-[#FFFBEB] dark:bg-[#1E293B] border border-[#FDE68A] dark:border-[#F59E0B]/30 border-l-4 border-l-[#F59E0B] rounded-lg px-3 py-2 text-xs text-[#92400E] dark:text-[#FBBF24]">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span><strong>Atenção:</strong> retorno acima de 5% ao dia é extremamente agressivo e aumenta muito o risco de perda total da banca.</span>
          </div>
        )}
      </div>
    </div>
  );
}
