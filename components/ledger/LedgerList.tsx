'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { decrypt } from '@/lib/crypto'
import { createBrowserClient } from '@/lib/supabase/client'
import type { LedgerEntryData, LedgerEntryRecord, DecryptedLedgerEntry } from '@/types'

export function LedgerList() {
  const { user } = useAuth()
  const { masterPassword } = useMasterPassword()
  const { showToast } = useToast()
  const supabase = useMemo(() => createBrowserClient(), [])

  const [entries, setEntries] = useState<DecryptedLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchEntries = useCallback(async () => {
    if (!user || !masterPassword) return
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      setLoading(false)
      return
    }

    const decrypted = await Promise.all(
      data.map(async (record: LedgerEntryRecord) => {
        try {
          const payload = await decrypt<LedgerEntryData>(masterPassword, {
            ciphertext: record.encrypted_payload,
            iv: record.iv,
            salt: record.salt,
          })
          return { ...payload, id: record.id, created_at: record.created_at }
        } catch {
          return null
        }
      })
    )

    setEntries(
      decrypted
        .filter((e): e is DecryptedLedgerEntry => e !== null)
        .sort((a, b) => b.date.localeCompare(a.date))
    )
    setLoading(false)
  }, [user, masterPassword, supabase])

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
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(
      (e) =>
        e.category.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q) ||
        e.date.includes(q)
    )
  }, [entries, search])

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {entries.length === 0 ? '暂无记录，添加第一笔收支吧！' : '未找到匹配的记录'}
        </div>
      ) : (
        <div className="ledger-entries">
          {filtered.map((entry) => (
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
      )}
    </section>
  )
}
