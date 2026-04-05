-- 账本模块：ledger_entries + ledger_categories
-- 零知识架构：服务端仅存储密文

-- ========================================
-- 账本记录表
-- ========================================
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_payload TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_id ON public.ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON public.ledger_entries(created_at DESC);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger_entries"
  ON public.ledger_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledger_entries"
  ON public.ledger_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ledger_entries"
  ON public.ledger_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ledger_entries"
  ON public.ledger_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 账本分类表
-- ========================================
CREATE TABLE IF NOT EXISTS public.ledger_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_payload TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_categories_user_id ON public.ledger_categories(user_id);

ALTER TABLE public.ledger_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger_categories"
  ON public.ledger_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledger_categories"
  ON public.ledger_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ledger_categories"
  ON public.ledger_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ledger_categories"
  ON public.ledger_categories FOR DELETE
  USING (auth.uid() = user_id);
