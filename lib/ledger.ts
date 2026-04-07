import type { LedgerEntry, LedgerType } from '@/types'

/** Supabase / PostgREST 返回的原始行 */
export type LedgerEntryDbRow = {
  id: string
  user_id: string
  type: string
  amount: unknown
  category: string | null
  note: string | null
  date: string
  created_at: string
}

export function ledgerEntryFromDbRow(raw: LedgerEntryDbRow): LedgerEntry | null {
  if (raw.type !== 'income' && raw.type !== 'expense') return null
  const amount = typeof raw.amount === 'string' ? parseFloat(raw.amount) : Number(raw.amount)
  if (!Number.isFinite(amount) || amount <= 0) return null

  const dateStr =
    typeof raw.date === 'string' ? raw.date.slice(0, 10) : String(raw.date).slice(0, 10)

  return {
    id: raw.id,
    type: raw.type as LedgerType,
    amount,
    category: raw.category?.trim() ? raw.category : '未分类',
    note: typeof raw.note === 'string' ? raw.note : '',
    date: dateStr,
    created_at: raw.created_at,
  }
}
