-- ============================================================
-- Simulador de Banca de Apostas — Supabase Schema
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- ============================================================

-- ─── EXTENSÕES ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── FUNÇÃO updated_at ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: cria profile automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── BANKROLL_SETTINGS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bankroll_settings (
  id                UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  initial_bankroll  NUMERIC(15,2) NOT NULL DEFAULT 1000,
  daily_return      NUMERIC(8,4)  NOT NULL DEFAULT 2,
  goal              NUMERIC(15,2) NOT NULL DEFAULT 10000,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.bankroll_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bankroll_settings: all own"
  ON public.bankroll_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_bankroll_settings_updated_at ON public.bankroll_settings;
CREATE TRIGGER trg_bankroll_settings_updated_at
  BEFORE UPDATE ON public.bankroll_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── DAY_STATUSES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.day_statuses (
  id         UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day        INTEGER     NOT NULL CHECK (day BETWEEN 1 AND 180),
  status     TEXT        NOT NULL CHECK (status IN ('pendente','vitoria','derrota','concluido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, day)
);

ALTER TABLE public.day_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "day_statuses: all own"
  ON public.day_statuses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_day_statuses_updated_at ON public.day_statuses;
CREATE TRIGGER trg_day_statuses_updated_at
  BEFORE UPDATE ON public.day_statuses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ACTIVITY_LOGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id         UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action     TEXT        NOT NULL,
  details    JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs: select own"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "activity_logs: insert own"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── FIM ─────────────────────────────────────────────────────────────────────
