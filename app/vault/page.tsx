'use client'

import { KeyForm } from '@/components/KeyForm'
import { VaultList } from '@/components/VaultList'

export default function VaultPage() {
  return (
    <div>
      <h1 className="page-title">密钥管理</h1>
      <KeyForm />
      <VaultList />
    </div>
  )
}
