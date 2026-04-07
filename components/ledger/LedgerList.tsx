'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { ledgerEntryFromDbRow, type LedgerEntryDbRow } from '@/lib/ledger'
import { createBrowserClient } from '@/lib/supabase/client'
import type { LedgerEntry, LedgerType } from '@/types'

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

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id)
    if (error) {
      showToast('删除失败', 'error')
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id))
      showToast('已删除')
    }
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
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <section className="vault-section">
      <div className="vault-header">
        <h2 className="vault-title">记录列表</h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <div className="tabs" style={{ marginBottom: 0, width: 'auto' }}>
            <button
              type="button"
              className={`tab ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setTypeFilter('all')
                setPage(1)
              }}
            >
              全部
            </button>
            <button
              type="button"
              className={`tab ${typeFilter === 'expense' ? 'active' : ''}`}
              onClick={() => {
                setTypeFilter('expense')
                setPage(1)
              }}
            >
              支出
            </button>
            <button
              type="button"
              className={`tab ${typeFilter === 'income' ? 'active' : ''}`}
              onClick={() => {
                setTypeFilter('income')
                setPage(1)
              }}
            >
              收入
            </button>
          </div>
          <input
            className="input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="搜索分类/备注..."
            style={{ maxWidth: '200px', fontSize: '12px', borderRadius: '999px' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {filtered.length} / {entries.length} 条
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          {entries.length === 0
            ? '暂无记录，添加第一笔收支吧！'
            : search.trim()
              ? '未找到匹配的记录'
              : typeFilter === 'expense'
                ? '暂无支出记录'
                : typeFilter === 'income'
                  ? '暂无收入记录'
                  : '未找到匹配的记录'}
        </div>
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
                  className="btn btn-danger"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => handleDelete(entry.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                ◀ 上一页
              </button>
              <span className="pagination-info">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                下一页 ▶
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
