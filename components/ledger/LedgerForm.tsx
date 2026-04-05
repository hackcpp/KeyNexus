'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { encrypt } from '@/lib/crypto'
import { createBrowserClient } from '@/lib/supabase/client'
import type { LedgerEntryData, LedgerType } from '@/types'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export function LedgerForm() {
  const { user } = useAuth()
  const { masterPassword } = useMasterPassword()
  const { showToast } = useToast()
  const supabase = useMemo(() => createBrowserClient(), [])

  const [type, setType] = useState<LedgerType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayString())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !masterPassword) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('请输入有效金额', 'error')
      return
    }

    setSaving(true)
    try {
      const payload: LedgerEntryData = {
        type,
        amount: amountNum,
        category: category.trim() || '未分类',
        note,
        date,
      }
      const encrypted = await encrypt(masterPassword, payload as unknown as Record<string, unknown>)

      const { error } = await supabase.from('ledger_entries').insert({
        user_id: user.id,
        encrypted_payload: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
      })

      if (error) throw error

      setAmount('')
      setNote('')
      setCategory('')
      showToast('已记录')
      window.dispatchEvent(new CustomEvent('ledger:refresh'))
    } catch {
      showToast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="form-card animate-fade-in">
      <div className="tabs">
        <button
          type="button"
          className={`tab ${type === 'expense' ? 'active' : ''}`}
          onClick={() => setType('expense')}
        >
          支出
        </button>
        <button
          type="button"
          className={`tab ${type === 'income' ? 'active' : ''}`}
          onClick={() => setType('income')}
        >
          收入
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>金额</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>日期</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>分类</label>
          <input
            className="input"
            placeholder="如：餐饮、交通、工资..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>备注</label>
          <input
            className="input"
            placeholder="可选"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={saving || !amount}
        >
          {saving ? '保存中...' : `记录${type === 'income' ? '收入' : '支出'}`}
        </button>
      </form>
    </section>
  )
}
