'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { decrypt } from '@/lib/crypto'
import {
  ledgerCategoryGroupKey,
  normalizeLedgerCategoryDisplay,
  pickRicherCategoryLabel,
} from '@/lib/ledger-category'
import { createBrowserClient } from '@/lib/supabase/client'
import { MonthPicker } from './MonthPicker'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { LedgerEntryData, LedgerEntryRecord, DecryptedLedgerEntry } from '@/types'

const INCOME_PIE_COLORS = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857']
const EXPENSE_PIE_COLORS = ['#ef4444', '#f87171', '#dc2626', '#fca5a5', '#b91c1c']

const TOOLTIP_STYLE = {
  contentStyle: { background: '#161620', border: '1px solid #35354a', borderRadius: '8px' },
  labelStyle: { color: '#ededf2' },
}

function lineTooltipFormatter(value: unknown) {
  if (value === undefined || value === null) return '—'
  if (Array.isArray(value) && value.length > 0) return lineTooltipFormatter(value[0])
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? `¥${n.toFixed(2)}` : String(value)
}

const PIE_CHART_MARGIN = { top: 20, right: 16, bottom: 4, left: 16 }

const PIE_LEGEND_WRAPPER_STYLE: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  paddingTop: 10,
  fontSize: 12,
  lineHeight: 1.5,
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
}

function pieSlicePercentLabel({ percent }: { percent?: number }) {
  return `${((percent ?? 0) * 100).toFixed(0)}%`
}

function pieLegendFormatter(value: unknown, entry: unknown) {
  const name = typeof value === 'string' ? value : String(value ?? '')
  const payload =
    entry &&
    typeof entry === 'object' &&
    entry !== null &&
    'payload' in entry &&
    typeof (entry as { payload?: unknown }).payload === 'object' &&
    (entry as { payload?: { value?: unknown } | null }).payload !== null
      ? (entry as { payload: { value?: unknown } }).payload
      : undefined
  const v = payload?.value
  if (typeof v === 'number' && Number.isFinite(v)) {
    return `${name} ${lineTooltipFormatter(v)}`
  }
  return name
}

type ViewMode = 'all' | 'year' | 'month'

type LedgerLinePoint = { label: string; 收入: number; 支出: number }

function aggregateLedgerCategoryAmounts(
  entries: DecryptedLedgerEntry[],
  ledgerType: 'income' | 'expense'
) {
  const map = new Map<string, { name: string; value: number }>()
  for (const e of entries) {
    if (e.type !== ledgerType) continue
    const display = normalizeLedgerCategoryDisplay(e.category ?? '')
    const key = ledgerCategoryGroupKey(display)
    const prev = map.get(key)
    if (prev) {
      prev.value += e.amount
      prev.name = pickRicherCategoryLabel(prev.name, display)
    } else {
      map.set(key, { name: display, value: e.amount })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

export function LedgerStats() {
  const { user } = useAuth()
  const { masterPassword } = useMasterPassword()
  const supabase = useMemo(() => createBrowserClient(), [])

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
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

  const currentEntries =
    viewMode === 'all' ? allEntries : viewMode === 'year' ? yearEntries : monthEntries

  const totalIncome = currentEntries
    .filter((e) => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0)
  const totalExpense = currentEntries
    .filter((e) => e.type === 'expense')
    .reduce((s, e) => s + e.amount, 0)
  const balance = totalIncome - totalExpense

  const availableYears = useMemo(() => {
    const years = new Set(allEntries.map((e) => parseInt(e.date.slice(0, 4))))
    if (years.size === 0) years.add(now.getFullYear())
    return Array.from(years).sort()
  }, [allEntries])

  const yearlyData = useMemo((): LedgerLinePoint[] => {
    return availableYears.map((y) => {
      const items = allEntries.filter((e) => e.date.startsWith(`${y}-`))
      return {
        label: `${y}`,
        收入: items.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0),
        支出: items.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
      }
    })
  }, [allEntries, availableYears])

  const monthlyData = useMemo((): LedgerLinePoint[] => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const prefix = `${year}-${String(m).padStart(2, '0')}`
      const items = allEntries.filter((e) => e.date.startsWith(prefix))
      return {
        label: `${m}月`,
        收入: items.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0),
        支出: items.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
      }
    })
  }, [allEntries, year])

  const dailyData = useMemo((): LedgerLinePoint[] => {
    const daysInMonth = new Date(year, month, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const items = allEntries.filter((e) => e.date.slice(0, 10) === dateStr)
      return {
        label: `${d}日`,
        收入: items.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0),
        支出: items.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
      }
    })
  }, [allEntries, year, month])

  const lineChartData = useMemo((): LedgerLinePoint[] => {
    if (viewMode === 'all') return yearlyData
    if (viewMode === 'year') return monthlyData
    return dailyData
  }, [viewMode, yearlyData, monthlyData, dailyData])

  const incomeCategoryData = useMemo(
    () => aggregateLedgerCategoryAmounts(currentEntries, 'income'),
    [currentEntries]
  )

  const expenseCategoryData = useMemo(
    () => aggregateLedgerCategoryAmounts(currentEntries, 'expense'),
    [currentEntries]
  )

  const summaryLabel = viewMode === 'all' ? '累计' : viewMode === 'year' ? '年度' : '本月'
  const periodLabel = viewMode === 'all' ? '全部' : viewMode === 'year' ? `${year}年` : `${month}月`

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
            className={`tab ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            全部
          </button>
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
        {viewMode === 'year' && (
          <div className="month-picker">
            <button type="button" className="btn btn-ghost" onClick={() => setYear(year - 1)}>
              ◀
            </button>
            <span className="month-picker-label">{year}年</span>
            <button type="button" className="btn btn-ghost" onClick={() => setYear(year + 1)}>
              ▶
            </button>
          </div>
        )}
        {viewMode === 'month' && (
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
          <div className="stat-card-label">{summaryLabel}结余</div>
          <div className={`stat-card-value ${balance >= 0 ? 'income' : 'expense'}`}>
            ¥{balance.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">{summaryLabel}收入</div>
          <div className="stat-card-value income">¥{totalIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">{summaryLabel}支出</div>
          <div className="stat-card-value expense">¥{totalExpense.toFixed(2)}</div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">
          {viewMode === 'all'
            ? '历年收支趋势'
            : viewMode === 'year'
              ? `${year}年 月度收支`
              : `${year}年${month}月 每日收支`}
        </div>
        <ResponsiveContainer
          key={viewMode === 'all' ? 'years' : viewMode === 'year' ? 'year-months' : 'month-days'}
          width="100%"
          height={300}
        >
          <LineChart
            data={lineChartData}
            margin={{
              top: 8,
              right: viewMode === 'month' ? 20 : 32,
              left: 8,
              bottom: viewMode === 'month' ? 20 : 24,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#262630" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9090a0', fontSize: viewMode === 'month' ? 10 : 12 }}
              interval={0}
              angle={viewMode === 'month' ? -45 : 0}
              textAnchor={viewMode === 'month' ? 'end' : 'middle'}
              height={viewMode === 'month' ? 56 : 36}
              padding={{ left: 4, right: 20 }}
              tickMargin={viewMode === 'month' ? 6 : 10}
            />
            <YAxis tick={{ fill: '#9090a0', fontSize: 12 }} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value, name) => [lineTooltipFormatter(value), name]}
            />
            <Line
              type="monotone"
              dataKey="收入"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="支出"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {(incomeCategoryData.length > 0 || expenseCategoryData.length > 0) && (
        <div className="chart-section">
          <div className="chart-title">{periodLabel}收支分类</div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              alignItems: 'flex-start',
            }}
          >
            {incomeCategoryData.length > 0 && (
              <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#a0a0b0',
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}
                >
                  收入分类
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart margin={PIE_CHART_MARGIN}>
                    <Pie
                      data={incomeCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="42%"
                      innerRadius={0}
                      outerRadius="58%"
                      label={pieSlicePercentLabel}
                      labelLine={{ stroke: '#6b6b80', strokeWidth: 1 }}
                    >
                      {incomeCategoryData.map((_, i) => (
                        <Cell key={i} fill={INCOME_PIE_COLORS[i % INCOME_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE.contentStyle}
                      formatter={(value) => lineTooltipFormatter(value)}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={PIE_LEGEND_WRAPPER_STYLE}
                      formatter={pieLegendFormatter}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {expenseCategoryData.length > 0 && (
              <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#a0a0b0',
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}
                >
                  支出分类
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart margin={PIE_CHART_MARGIN}>
                    <Pie
                      data={expenseCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="42%"
                      innerRadius={0}
                      outerRadius="58%"
                      label={pieSlicePercentLabel}
                      labelLine={{ stroke: '#6b6b80', strokeWidth: 1 }}
                    >
                      {expenseCategoryData.map((_, i) => (
                        <Cell key={i} fill={EXPENSE_PIE_COLORS[i % EXPENSE_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE.contentStyle}
                      formatter={(value) => lineTooltipFormatter(value)}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={PIE_LEGEND_WRAPPER_STYLE}
                      formatter={pieLegendFormatter}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
