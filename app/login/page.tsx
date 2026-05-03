'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

type Mode = 'login' | 'signup' | 'forgot';

// ─── App Mockup ───────────────────────────────────────────────────────────────

function AppMockup() {
  const chartPath = 'M0,45 L11,42 L22,39 L33,41 L44,37 L55,34 L66,35 L77,31 L88,28 L99,30 L110,27 L121,24 L132,21 L143,23 L154,19 L165,16 L176,14 L187,11 L198,9 L209,7 L220,5';
  const areaPath  = `${chartPath} L220,50 L0,50 Z`;

  const kpis = [
    { label: 'Banca atual',  value: 'R$2.094',  sub: '+109,4%', green: true },
    { label: 'Dias ganhos',  value: '38',        sub: 'de 45',   green: true },
    { label: 'Win rate',     value: '84,4%',     sub: '+4,2pp',  green: true },
    { label: 'Meta',         value: '41,8%',     sub: 'R$5.000', green: false },
  ];

  const rows = [
    { day: 43, status: 'win',  pct: '+3,0%', val: 'R$2.033' },
    { day: 44, status: 'win',  pct: '+3,0%', val: 'R$2.094' },
    { day: 45, status: 'open', pct: '—',     val: 'R$2.094' },
  ];

  return (
    <div className="relative w-full select-none">
      {/* glow behind mockup */}
      <div className="absolute -inset-4 bg-gradient-to-b from-[#2563EB]/15 via-[#7C3AED]/10 to-transparent blur-2xl rounded-3xl pointer-events-none" />

      {/* Browser chrome */}
      <div
        className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-[#334155] shadow-[0_24px_80px_rgba(0,0,0,0.14)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        style={{ transform: 'perspective(1000px) rotateX(2deg)' }}
      >
        {/* URL bar */}
        <div className="flex items-center gap-2.5 bg-[#F1F5F9] dark:bg-[#0F172A] px-3 py-2 border-b border-[#E2E8F0] dark:border-[#334155]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-md px-2.5 py-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
            <span className="text-[9px] text-[#94A3B8] tracking-tight">cuidardabanca.vercel.app/dashboard</span>
          </div>
        </div>

        {/* App content */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A]">

          {/* App header */}
          <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-[#2563EB] rounded flex items-center justify-center">
                <BarChart3 className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-[9px] font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">Simulador de Banca</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-[#94A3B8]">usuario@email.com</span>
              <div className="w-5 h-2.5 bg-[#F1F5F9] dark:bg-[#334155] rounded" />
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-3 flex gap-0.5">
            {['Dashboard', 'Simulação', 'Gráficos', 'Análise', 'Sessões'].map((t, i) => (
              <div
                key={t}
                className={`text-[8px] px-2.5 py-1.5 relative font-medium ${
                  i === 0
                    ? 'text-[#2563EB]'
                    : 'text-[#94A3B8]'
                }`}
              >
                {t}
                {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t" />}
              </div>
            ))}
          </div>

          <div className="p-3 space-y-2.5">
            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-2">
              {kpis.map((k) => (
                <div key={k.label} className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-2">
                  <p className="text-[7px] text-[#94A3B8] mb-0.5">{k.label}</p>
                  <p className="text-[10px] font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-none">{k.value}</p>
                  <p className={`text-[7px] mt-0.5 font-medium ${k.green ? 'text-[#22C55E]' : 'text-[#94A3B8]'}`}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Evolução da Banca</span>
                <span className="text-[7px] text-[#22C55E] font-medium bg-[#F0FDF4] dark:bg-[#14532D]/40 px-1.5 py-0.5 rounded-full">+109,4%</span>
              </div>
              <svg viewBox="0 0 220 50" className="w-full" preserveAspectRatio="none" style={{ height: 52 }}>
                <defs>
                  <linearGradient id="mockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[10, 25, 40].map(y => (
                  <line key={y} x1="0" y1={y} x2="220" y2={y} stroke="#E2E8F0" strokeWidth="0.5" className="dark:stroke-[#334155]" />
                ))}
                <path d={areaPath} fill="url(#mockGrad)" />
                <path d={chartPath} fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Current point dot */}
                <circle cx="220" cy="5" r="2.5" fill="#2563EB" />
                <circle cx="220" cy="5" r="4" fill="#2563EB" fillOpacity="0.2" />
              </svg>
            </div>

            {/* Mini table */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
              <div className="grid grid-cols-4 gap-1 px-2.5 py-1.5 bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155]">
                {['Dia', 'Status', 'Retorno', 'Banca'].map(h => (
                  <span key={h} className="text-[7px] font-semibold text-[#94A3B8] uppercase tracking-wide">{h}</span>
                ))}
              </div>
              {rows.map((r) => (
                <div key={r.day} className="grid grid-cols-4 gap-1 px-2.5 py-1.5 border-b border-[#F1F5F9] dark:border-[#1E293B] last:border-0">
                  <span className="text-[8px] font-medium text-[#0F172A] dark:text-[#F1F5F9]">{r.day}</span>
                  <span className={`text-[7px] font-semibold px-1.5 py-0.5 rounded-full w-fit ${
                    r.status === 'win'  ? 'bg-[#F0FDF4] dark:bg-[#14532D]/50 text-[#15803D] dark:text-[#4ADE80]' :
                    r.status === 'open' ? 'bg-[#F8FAFC] dark:bg-[#334155] text-[#94A3B8]' :
                                          'bg-[#FEF2F2] dark:bg-[#7F1D1D]/50 text-[#DC2626] dark:text-[#FCA5A5]'
                  }`}>
                    {r.status === 'win' ? 'Vitória' : r.status === 'open' ? 'Aberto' : 'Derrota'}
                  </span>
                  <span className={`text-[8px] font-medium ${r.pct === '—' ? 'text-[#94A3B8]' : 'text-[#22C55E]'}`}>{r.pct}</span>
                  <span className="text-[8px] text-[#0F172A] dark:text-[#F1F5F9]">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

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
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full bg-[#2563EB]/6 dark:bg-[#2563EB]/10 blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-[#7C3AED]/5 dark:bg-[#7C3AED]/8 blur-3xl" />
        <div className="absolute -bottom-48 right-1/3 w-[400px] h-[400px] rounded-full bg-[#0EA5E9]/5 dark:bg-[#0EA5E9]/8 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 max-w-[1200px] mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-sm tracking-tight">Simulador de Banca</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1100px] grid lg:grid-cols-[1fr_400px] gap-16 items-center">

          {/* Left — mockup */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="hidden lg:flex flex-col gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EFF6FF] dark:bg-[#1e3a5f] border border-[#BFDBFE] dark:border-[#1e40af] rounded-full px-3.5 py-1.5 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-xs font-semibold text-[#2563EB] dark:text-[#93C5FD]">Gestão profissional de apostas</span>
              </div>
              <h2 className="text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-tight tracking-tight">
                Simule, registre e evolua<br />
                <span className="text-[#2563EB]">sua banca</span> com dados reais
              </h2>
              <p className="text-[#64748B] dark:text-[#94A3B8] mt-3 text-sm leading-relaxed max-w-md">
                Projete crescimento com juros compostos, registre resultados diários, acompanhe gráficos e receba análises de risco automáticas.
              </p>
            </div>

            <AppMockup />

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {['#2563EB','#7C3AED','#0EA5E9','#22C55E'].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-[#0B1120] flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: c }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Usado por apostadores que levam a banca a sério
              </p>
            </div>
          </motion.div>

          {/* Right — form */}
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
                          : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] hover:bg-[#F8FAFC]/60 dark:hover:bg-[#0F172A]/30'
                      }`}
                    >
                      {m === 'login' ? 'Entrar' : 'Criar conta'}
                      {mode === m && (
                        <motion.div layoutId="loginTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]" />
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
                        <button type="button" onClick={() => switchMode('login')}
                          className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#93C5FD] transition-colors mb-5">
                          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
                        </button>
                        <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-1.5">Recuperar senha</h2>
                        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6">Enviaremos um link para redefinir sua senha.</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} />
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
                            {mode === 'login' ? 'Entre para acessar seu simulador' : 'Comece a simular sua banca gratuitamente'}
                          </p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} />
                          <Field label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" minLength={6} icon={<Lock className="w-4 h-4" />} />
                          <div className="pt-1">
                            <SubmitBtn loading={loading}>
                              {mode === 'login' ? 'Entrar na conta' : 'Criar conta grátis'}
                            </SubmitBtn>
                          </div>
                          {mode === 'login' && (
                            <button type="button" onClick={() => switchMode('forgot')}
                              className="w-full text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#93C5FD] transition-colors py-1">
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

            <p className="text-center text-xs text-[#94A3B8] dark:text-[#64748B] mt-5">
              Ao continuar, você concorda com os termos de uso e política de privacidade.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">{icon}</div>}
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required minLength={minLength}
          className={`w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl py-3 text-sm text-[#0F172A] dark:text-[#F1F5F9] placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all hover:border-[#CBD5E1] dark:hover:border-[#475569] ${icon ? 'pl-10 pr-3' : 'px-3'}`}
        />
      </div>
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1e40af] text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25">
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</> : children}
    </button>
  );
}
