'use client'

import { useState } from 'react'
import { LedgerForm } from '@/components/ledger/LedgerForm'
import { LedgerList } from '@/components/ledger/LedgerList'
import { LedgerStats } from '@/components/ledger/LedgerStats'

export default function LedgerPage() {
  const [tab, setTab] = useState<'records' | 'stats'>('stats')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          收支账本
        </h1>
        <div className="tabs" style={{ marginBottom: 0, width: 'auto' }}>
          <button
            type="button"
            className={`tab ${tab === 'stats' ? 'active' : ''}`}
            onClick={() => setTab('stats')}
          >
            统计
          </button>
          <button
            type="button"
            className={`tab ${tab === 'records' ? 'active' : ''}`}
            onClick={() => setTab('records')}
          >
            记账
          </button>
        </div>
      </div>

      {tab === 'records' ? (
        <>
          <LedgerForm />
          <LedgerList />
        </>
      ) : (
        <LedgerStats />
      )}
    </div>
  )
}
