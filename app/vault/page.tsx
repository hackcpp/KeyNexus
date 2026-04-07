'use client'

import { KeyForm, VaultList } from '@/components/vault'

export default function VaultPage() {
  return (
    <div>
      <h1 className="page-title">密钥管理</h1>
      <KeyForm />
      <VaultList />
    </div>
  )
}
