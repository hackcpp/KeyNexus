'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { decrypt } from '@/lib/crypto'
import { createBrowserClient } from '@/lib/supabase/client'
import type { LedgerEntryData, LedgerEntryRecord, DecryptedLedgerEntry } from '@/types'

export function DashboardOverview() {
  const { user } = useAuth()
  const { masterPassword } = useMasterPassword()
  const supabase = useMemo(() => createBrowserClient(), [])

  const [entries, setEntries] = useState<DecryptedLedgerEntry[]>([])
  const [keyCount, setKeyCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const fetchData = useCallback(async () => {
    if (!user || !masterPassword) return

    const [keysRes, entriesRes] = await Promise.all([
      supabase.from('api_keys').select('id', { count: 'exact', head: true }),
      supabase.from('ledger_entries').select('*').order('created_at', { ascending: false }),
    ])

    setKeyCount(keysRes.count || 0)

    if (entriesRes.data) {
      const decrypted = await Promise.all(
        entriesRes.data.map(async (r: LedgerEntryRecord) => {
          try {
            const p = await decrypt<LedgerEntryData>(masterPassword, {
              ciphertext: r.encrypted_payload,
              iv: r.iv,
              salt: r.salt,
            })
            return { ...p, id: r.id, created_at: r.created_at }
          } catch {
            return null
          }
        })
      )
      setEntries(decrypted.filter((e): e is DecryptedLedgerEntry => e !== null))
    }

    setLoading(false)
  }, [user, masterPassword, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const allIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const allExpense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const allBalance = allIncome - allExpense

  const monthEntries = entries.filter((e) => e.date.startsWith(monthPrefix))
  const monthIncome = monthEntries
    .filter((e) => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0)
  const monthExpense = monthEntries
    .filter((e) => e.type === 'expense')
    .reduce((s, e) => s + e.amount, 0)

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">系统总览</h1>

      <h2 className="section-subtitle">累计统计</h2>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-label">累计收入</div>
          <div className="stat-card-value income">¥{allIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">累计支出</div>
          <div className="stat-card-value expense">¥{allExpense.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">累计结余</div>
          <div className={`stat-card-value ${allBalance >= 0 ? 'income' : 'expense'}`}>
            ¥{allBalance.toFixed(2)}
          </div>
        </div>
      </div>

      <h2 className="section-subtitle">本月概况</h2>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-label">本月收入</div>
          <div className="stat-card-value income">¥{monthIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">本月支出</div>
          <div className="stat-card-value expense">¥{monthExpense.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">本月结余</div>
          <div
            className={`stat-card-value ${monthIncome - monthExpense >= 0 ? 'income' : 'expense'}`}
          >
            ¥{(monthIncome - monthExpense).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="quick-links">
        <Link href="/vault" className="quick-link">
          <div className="quick-link-icon">🔐</div>
          <div className="quick-link-title">密钥管理</div>
          <div className="quick-link-desc">{keyCount} 个密钥</div>
        </Link>
        <Link href="/ledger" className="quick-link">
          <div className="quick-link-icon">📒</div>
          <div className="quick-link-title">收支账本</div>
          <div className="quick-link-desc">{entries.length} 条记录</div>
        </Link>
      </div>

      {monthEntries.length > 0 && (
        <div>
          <h2 className="section-subtitle">最近记录</h2>
          <div className="ledger-entries">
            {monthEntries
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((entry) => (
                <div key={entry.id} className="ledger-entry">
                  <span className="ledger-entry-date">{entry.date}</span>
                  <span className="ledger-entry-category">{entry.category}</span>
                  <span className="ledger-entry-note">{entry.note}</span>
                  <span className={`ledger-entry-amount ${entry.type}`}>
                    {entry.type === 'income' ? '+' : '-'}
                    {entry.amount.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
