'use client'

import { AuthProvider, useAuth } from '@/components/providers/AuthProvider'
import { MasterPasswordProvider } from '@/components/providers/MasterPasswordProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { LoginPage } from '@/components/LoginPage'
import { AppShell } from '@/components/AppShell'

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div className="loading">
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <MasterPasswordProvider>
      <AppShell>{children}</AppShell>
    </MasterPasswordProvider>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
    </ToastProvider>
  )
}
