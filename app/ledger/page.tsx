'use client'

import { useState } from 'react'
import { LedgerForm } from '@/components/ledger/LedgerForm'
import { LedgerList } from '@/components/ledger/LedgerList'
import { LedgerStats } from '@/components/ledger/LedgerStats'
import { Tabs } from '@/components/ui'

type ViewTab = 'stats' | 'records'

export default function LedgerPage() {
  const [tab, setTab] = useState<ViewTab>('stats')

  return (
    <div>
      <div className="stats-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          收支账本
        </h1>
        <Tabs<ViewTab>
          tabs={[
            { label: '统计', value: 'stats' },
            { label: '记账', value: 'records' },
          ]}
          activeValue={tab}
          onTabChange={setTab}
        />
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
