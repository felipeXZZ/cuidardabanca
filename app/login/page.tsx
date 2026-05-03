'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, Mail, Lock, ArrowLeft, Loader2, TrendingUp, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#2563EB]/5 dark:bg-[#2563EB]/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#7C3AED]/5 dark:bg-[#7C3AED]/8 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 max-w-[1200px] mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-sm tracking-tight">
            Simulador de Banca
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[1000px] grid lg:grid-cols-2 gap-12 items-center">

          {/* Left side — hero text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="hidden lg:flex flex-col gap-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EFF6FF] dark:bg-[#1e3a5f] border border-[#BFDBFE] dark:border-[#1e40af] rounded-full px-3.5 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-xs font-semibold text-[#2563EB] dark:text-[#93C5FD]">Gestão profissional de banca</span>
              </div>
              <h2 className="text-4xl font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-tight tracking-tight">
                Simule e controle<br />
                <span className="text-[#2563EB]">sua banca</span> com<br />
                precisão
              </h2>
              <p className="text-[#64748B] dark:text-[#94A3B8] mt-4 text-base leading-relaxed max-w-sm">
                Projete crescimento com juros compostos, registre resultados diários e acompanhe sua evolução com gráficos e análises de risco.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { icon: TrendingUp, label: 'Projeção com juros compostos', desc: 'Simulação de 180 dias com metas personalizadas' },
                { icon: Shield,     label: 'Análise de risco em tempo real', desc: 'Score de risco, drawdown máximo e streaks' },
                { icon: Zap,        label: 'Insights automáticos',           desc: 'Alertas inteligentes sobre sua performance' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3.5 p-4 bg-white dark:bg-[#1E293B]/60 border border-[#E2E8F0] dark:border-[#334155] rounded-xl backdrop-blur-sm">
                  <div className="w-9 h-9 bg-[#EFF6FF] dark:bg-[#1e3a5f] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{label}</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right side — form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
          >
            {/* Mobile brand */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#2563EB] rounded-xl mb-3 shadow-lg shadow-blue-500/25">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">Simulador de Banca</h1>
              <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1">Sistema de gestão de apostas esportivas</p>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_48px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_16px_48px_rgba(0,0,0,0.4)] border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">

              {/* Tabs */}
              {mode !== 'forgot' && (
                <div className="flex border-b border-[#E2E8F0] dark:border-[#334155]">
                  {(['login', 'signup'] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchMode(m)}
                      className={`flex-1 py-4 text-sm font-semibold relative transition-colors ${
                        mode === m
                          ? 'text-[#2563EB] bg-[#F8FAFC] dark:bg-[#0F172A]/50'
                          : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]/30'
                      }`}
                    >
                      {m === 'login' ? 'Entrar' : 'Criar conta'}
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

              <div className="p-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* Alert message */}
                    <AnimatePresence>
                      {msg && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className={`rounded-xl px-4 py-3 text-sm border flex items-start gap-2.5 ${
                            msg.type === 'ok'
                              ? 'bg-[#F0FDF4] dark:bg-[#14532D]/30 border-[#BBF7D0] dark:border-[#166534] text-[#15803D] dark:text-[#4ADE80]'
                              : 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border-[#FECACA] dark:border-[#991B1B] text-[#DC2626] dark:text-[#FCA5A5]'
                          }`}
                        >
                          <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${msg.type === 'ok' ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
                          {msg.text}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {mode === 'forgot' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#93C5FD] transition-colors mb-5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Voltar ao login
                        </button>
                        <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-1.5">Recuperar senha</h2>
                        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6">
                          Enviaremos um link para redefinir sua senha.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <Field label="Email" type="email" value={email} onChange={setEmail}
                            placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} />
                          <SubmitBtn loading={loading}>Enviar link de recuperação</SubmitBtn>
                        </form>
                      </>
                    ) : (
                      <>
                        <div className="mb-6">
                          <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                            {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                          </h2>
                          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                            {mode === 'login'
                              ? 'Entre para acessar seu simulador'
                              : 'Comece a simular sua banca gratuitamente'}
                          </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                          <Field label="Email" type="email" value={email} onChange={setEmail}
                            placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} />
                          <Field label="Senha" type="password" value={password} onChange={setPassword}
                            placeholder="••••••••" minLength={6} icon={<Lock className="w-4 h-4" />} />
                          <div className="pt-1">
                            <SubmitBtn loading={loading}>
                              {mode === 'login' ? 'Entrar na conta' : 'Criar conta grátis'}
                            </SubmitBtn>
                          </div>
                          {mode === 'login' && (
                            <button
                              type="button"
                              onClick={() => switchMode('forgot')}
                              className="w-full text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#93C5FD] transition-colors py-1"
                            >
                              Esqueci minha senha
                            </button>
                          )}
                        </form>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-[#94A3B8] dark:text-[#64748B] mt-5">
              Ao continuar, você concorda com os termos de uso e política de privacidade.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, minLength, icon }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; minLength?: number; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#374151] dark:text-[#94A3B8] uppercase tracking-wide mb-1.5">
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
          className={`w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl py-3 text-sm text-[#0F172A] dark:text-[#F1F5F9] placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all hover:border-[#CBD5E1] dark:hover:border-[#475569] ${icon ? 'pl-10 pr-3' : 'px-3'}`}
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
      className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1e40af] text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25"
    >
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</> : children}
    </button>
  );
}
