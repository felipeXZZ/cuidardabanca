'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Mode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const switchMode = (m: Mode) => { setMode(m); setMsg(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg({ type: 'ok', text: 'Conta criada! Verifique seu email para confirmar o cadastro.' });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        setMsg({ type: 'ok', text: 'Email de recuperação enviado! Verifique sua caixa de entrada.' });
      }
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.';
      setMsg({ type: 'err', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[420px]"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#2563EB] rounded-xl mb-4 shadow-lg shadow-blue-500/25">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">Simulador de Banca</h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1.5">Sistema de gestão de apostas esportivas</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
          {/* Tabs */}
          {mode !== 'forgot' && (
            <div className="flex border-b border-[#E2E8F0] dark:border-[#334155]">
              {(['login', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-3.5 text-sm font-semibold relative transition-colors ${
                    mode === m ? 'text-[#2563EB]' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
                  }`}
                >
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                  {mode === m && (
                    <motion.div
                      layoutId="loginTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="p-6">
            <AnimatePresence>
              {msg && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={`rounded-lg px-4 py-3 text-sm border ${
                    msg.type === 'ok'
                      ? 'bg-[#F0FDF4] dark:bg-[#14532D]/30 border-[#BBF7D0] dark:border-[#166534] text-[#15803D] dark:text-[#4ADE80]'
                      : 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border-[#FECACA] dark:border-[#991B1B] text-[#DC2626] dark:text-[#FCA5A5]'
                  }`}
                >
                  {msg.text}
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'forgot' ? (
              <>
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao login
                  </button>
                  <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mt-4 mb-1">Recuperar senha</h2>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                    Informe seu email e enviaremos um link para redefinir sua senha.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field label="Email" type="email" value={email} onChange={setEmail}
                    placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} />
                  <SubmitBtn loading={loading}>Enviar Email de Recuperação</SubmitBtn>
                </form>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Email" type="email" value={email} onChange={setEmail}
                  placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} />
                <Field label="Senha" type="password" value={password} onChange={setPassword}
                  placeholder="••••••••" minLength={6} icon={<Lock className="w-4 h-4" />} />
                <SubmitBtn loading={loading}>
                  {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                </SubmitBtn>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="w-full text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] transition-colors pt-1"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, minLength, icon }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; minLength?: number; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          minLength={minLength}
          className={`w-full bg-[#FFF2CC] dark:bg-[#3F3F1F] border border-[#E2E8F0] dark:border-[#475569] rounded-lg py-2.5 text-sm text-[#0F172A] dark:text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all ${icon ? 'pl-9 pr-3' : 'px-3'}`}
        />
      </div>
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
    >
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</> : children}
    </button>
  );
}
