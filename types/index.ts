/**
 * SoloBiz 类型定义
 */

export type LedgerType = 'income' | 'expense'

/** 单条账本记录（与表 public.ledger_entries 业务列一致，不含 user_id） */
export interface LedgerEntry {
  id: string
  type: LedgerType
  amount: number
  category: string
  note: string
  date: string
  created_at: string
}

/** 新建/表单用（无 id、时间戳） */
export type LedgerEntryInput = Omit<LedgerEntry, 'id' | 'created_at'>
