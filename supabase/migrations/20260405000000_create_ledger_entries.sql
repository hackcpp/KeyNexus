-- 账本主表：每条记录对应一笔收入或支出
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT '未分类',
  note TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引：覆盖「按用户查看最近记录」的常见查询
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_created
  ON public.ledger_entries(user_id, created_at DESC);

-- 启用 RLS，所有访问必须经过策略校验
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- 仅允许用户读取自己的账本记录
CREATE POLICY "Users can view own ledger_entries"
  ON public.ledger_entries FOR SELECT
  USING (auth.uid() = user_id);

-- 仅允许用户写入 user_id 为自己的记录
CREATE POLICY "Users can insert own ledger_entries"
  ON public.ledger_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 仅允许用户删除自己的记录
CREATE POLICY "Users can delete own ledger_entries"
  ON public.ledger_entries FOR DELETE
  USING (auth.uid() = user_id);
