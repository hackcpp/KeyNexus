'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { decrypt } from '@/lib/crypto'
import { createBrowserClient } from '@/lib/supabase/client'
import { MonthPicker } from './MonthPicker'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import type { LedgerEntryData, LedgerEntryRecord, DecryptedLedgerEntry } from '@/types'

const COLORS = [
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
]

const TOOLTIP_STYLE = {
  contentStyle: { background: '#161620', border: '1px solid #35354a', borderRadius: '8px' },
  labelStyle: { color: '#ededf2' },
}

type ViewMode = 'year' | 'month'

export function LedgerStats() {
  const { user } = useAuth()
  const { masterPassword } = useMasterPassword()
  const supabase = useMemo(() => createBrowserClient(), [])

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [viewMode, setViewMode] = useState<ViewMode>('year')
  const [allEntries, setAllEntries] = useState<DecryptedLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user || !masterPassword) return
    const { data } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (!data) {
      setLoading(false)
      return
    }

    const decrypted = await Promise.all(
      data.map(async (r: LedgerEntryRecord) => {
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

    setAllEntries(decrypted.filter((e): e is DecryptedLedgerEntry => e !== null))
    setLoading(false)
  }, [user, masterPassword, supabase])

  useEffect(() => {
    fetchAll()
    const handler = () => fetchAll()
    window.addEventListener('ledger:refresh', handler)
    return () => window.removeEventListener('ledger:refresh', handler)
  }, [fetchAll])

  const yearEntries = useMemo(
    () => allEntries.filter((e) => e.date.startsWith(`${year}-`)),
    [allEntries, year]
  )

  const monthEntries = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return allEntries.filter((e) => e.date.startsWith(prefix))
  }, [allEntries, year, month])

  const currentEntries = viewMode === 'year' ? yearEntries : monthEntries

  const totalIncome = currentEntries
    .filter((e) => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0)
  const totalExpense = currentEntries
    .filter((e) => e.type === 'expense')
    .reduce((s, e) => s + e.amount, 0)
  const balance = totalIncome - totalExpense

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const prefix = `${year}-${String(m).padStart(2, '0')}`
      const items = allEntries.filter((e) => e.date.startsWith(prefix))
      return {
        month: `${m}月`,
        收入: items.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0),
        支出: items.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
      }
    })
  }, [allEntries, year])

  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    currentEntries
      .filter((e) => e.type === 'expense')
      .forEach((e) => {
        map.set(e.category, (map.get(e.category) || 0) + e.amount)
      })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [currentEntries])

  const periodLabel = viewMode === 'year' ? `${year}年` : `${month}月`
  const summaryLabel = viewMode === 'year' ? '年度' : '本月'

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div className="tabs" style={{ marginBottom: 0, width: 'auto' }}>
          <button
            type="button"
            className={`tab ${viewMode === 'year' ? 'active' : ''}`}
            onClick={() => setViewMode('year')}
          >
            按年
          </button>
          <button
            type="button"
            className={`tab ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            按月
          </button>
        </div>
        {viewMode === 'year' ? (
          <div className="month-picker" style={{ marginBottom: 0 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setYear(year - 1)}>
              ◀
            </button>
            <span className="month-picker-label">{year}年</span>
            <button type="button" className="btn btn-ghost" onClick={() => setYear(year + 1)}>
              ▶
            </button>
          </div>
        ) : (
          <MonthPicker
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y)
              setMonth(m)
            }}
          />
        )}
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-label">{summaryLabel}收入</div>
          <div className="stat-card-value income">¥{totalIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">{summaryLabel}支出</div>
          <div className="stat-card-value expense">¥{totalExpense.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">结余</div>
          <div className={`stat-card-value ${balance >= 0 ? 'income' : 'expense'}`}>
            ¥{balance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">{year}年月度收支</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fill: '#9090a0', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9090a0', fontSize: 12 }} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="收入" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {categoryData.length > 0 && (
        <div className="chart-section">
          <div className="chart-title">{periodLabel}支出分类</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
