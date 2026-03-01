'use client'

import { AuthProvider, useAuth } from '@/components/providers/AuthProvider'
import { MasterPasswordProvider } from '@/components/providers/MasterPasswordProvider'
import { LoginPage } from '@/components/LoginPage'
import { Header } from '@/components/Header'
import { KeyForm } from '@/components/KeyForm'
import { VaultList } from '@/components/VaultList'

function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</p>
      </main>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <MasterPasswordProvider>
      <main>
        <Header />
        <KeyForm />
        <VaultList />
      </main>
    </MasterPasswordProvider>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}
