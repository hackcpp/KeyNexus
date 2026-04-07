'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { ledgerEntryFromDbRow, type LedgerEntryDbRow } from '@/lib/ledger'
import { createBrowserClient } from '@/lib/supabase/client'
import type { LedgerEntry } from '@/types'

export function DashboardOverview() {
  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(), [])

  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [keyCount, setKeyCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const fetchData = useCallback(async () => {
    if (!user) return

    const [keysRes, entriesRes] = await Promise.all([
      supabase.from('api_keys').select('id', { count: 'exact', head: true }),
      supabase.from('ledger_entries').select('*').order('created_at', { ascending: false }),
    ])

    setKeyCount(keysRes.count || 0)

    if (entriesRes.data) {
      setEntries(
        entriesRes.data
          .map((r) => ledgerEntryFromDbRow(r as LedgerEntryDbRow))
          .filter((e): e is LedgerEntry => e !== null)
      )
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const onLedgerRefresh = () => fetchData()
    const onVaultRefresh = () => fetchData()
    window.addEventListener('ledger:refresh', onLedgerRefresh)
    window.addEventListener('vault:refresh', onVaultRefresh)
    return () => {
      window.removeEventListener('ledger:refresh', onLedgerRefresh)
      window.removeEventListener('vault:refresh', onVaultRefresh)
    }
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
          <div className="stat-card-label">累计结余</div>
          <div className={`stat-card-value ${allBalance >= 0 ? 'income' : 'expense'}`}>
            ¥{allBalance.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">累计收入</div>
          <div className="stat-card-value income">¥{allIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">累计支出</div>
          <div className="stat-card-value expense">¥{allExpense.toFixed(2)}</div>
        </div>
      </div>

      <h2 className="section-subtitle">本月概况</h2>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-label">本月结余</div>
          <div
            className={`stat-card-value ${monthIncome - monthExpense >= 0 ? 'income' : 'expense'}`}
          >
            ¥{(monthIncome - monthExpense).toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">本月收入</div>
          <div className="stat-card-value income">¥{monthIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">本月支出</div>
          <div className="stat-card-value expense">¥{monthExpense.toFixed(2)}</div>
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
    </div>
  )
}
