'use client'

import { useState } from 'react'
import { KeyForm, type EditKeyData } from '@/components/vault/KeyForm'
import { VaultList } from '@/components/vault/VaultList'

export default function VaultPage() {
  const [editingItem, setEditingItem] = useState<EditKeyData | null>(null)

  return (
    <div>
      <h1 className="page-title">密钥管理</h1>
      <KeyForm editData={editingItem} onCancel={() => setEditingItem(null)} />
      <VaultList onEdit={setEditingItem} />
    </div>
  )
}
