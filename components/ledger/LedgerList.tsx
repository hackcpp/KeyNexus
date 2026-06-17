'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { ledgerEntryFromDbRow, type LedgerEntryDbRow } from '@/lib/ledger'
import { createBrowserClient } from '@/lib/supabase/client'
import type { LedgerEntry, LedgerType } from '@/types'
import { Tabs, Pagination, EmptyState, Spinner } from '@/components/ui'

type TypeFilter = 'all' | LedgerType

const PAGE_SIZE = 10

export function LedgerList() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const supabase = useMemo(() => createBrowserClient(), [])

  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [page, setPage] = useState(1)

  const fetchEntries = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      setLoading(false)
      return
    }

    const list = data
      .map((record) => ledgerEntryFromDbRow(record as LedgerEntryDbRow))
      .filter((e): e is LedgerEntry => e !== null)
      .sort((a, b) => b.date.localeCompare(a.date))

    setEntries(list)
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchEntries()
    const handler = () => fetchEntries()
    window.addEventListener('ledger:refresh', handler)
    return () => window.removeEventListener('ledger:refresh', handler)
  }, [fetchEntries])

  const [deletingEntry, setDeletingEntry] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id)
    if (error) {
      showToast('删除失败', 'error')
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id))
      showToast('已删除')
    }
    setDeletingEntry(null)
  }

  const filtered = useMemo(() => {
    const list = typeFilter === 'all' ? entries : entries.filter((e) => e.type === typeFilter)
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (e) =>
        e.category.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q) ||
        e.date.includes(q)
    )
  }, [entries, search, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedEntries = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (loading) {
    return <Spinner />
  }

  return (
    <section className="vault-section">
      <div className="vault-header">
        <h2 className="vault-title">记录列表</h2>
        <div className="controls-row">
          <Tabs<TypeFilter>
            tabs={[
              { label: '全部', value: 'all' },
              { label: '支出', value: 'expense' },
              { label: '收入', value: 'income' },
            ]}
            activeValue={typeFilter}
            onTabChange={(v) => {
              setTypeFilter(v)
              setPage(1)
            }}
          />
          <input
            className="input input-pill"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="搜索分类/备注..."
          />
          <span className="stat-counter">
            {filtered.length} / {entries.length} 条
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>
          {entries.length === 0
            ? '暂无记录，添加第一笔收支吧！'
            : search.trim()
              ? '未找到匹配的记录'
              : typeFilter === 'expense'
                ? '暂无支出记录'
                : typeFilter === 'income'
                  ? '暂无收入记录'
                  : '未找到匹配的记录'}
        </EmptyState>
      ) : (
        <>
          <div className="ledger-entries">
            {pagedEntries.map((entry) => (
              <div key={entry.id} className="ledger-entry animate-fade-in">
                <span className="ledger-entry-date">{entry.date}</span>
                <span className="ledger-entry-category">{entry.category}</span>
                <span className="ledger-entry-note">{entry.note}</span>
                <span className={`ledger-entry-amount ${entry.type}`}>
                  {entry.type === 'income' ? '+' : '-'}
                  {entry.amount.toFixed(2)}
                </span>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => setDeletingEntry(entry.id)}
                >
                  🗑️
                </button>
                {deletingEntry === entry.id ? (
                  <div className="confirm-actions">
                    <button
                      type="button"
                      className="btn btn-danger btn-confirm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      确认
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-confirm"
                      onClick={() => setDeletingEntry(null)}
                    >
                      取消
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </section>
  )
}
