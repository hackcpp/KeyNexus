'use client'

import { useAuth } from '@/components/providers/AuthProvider'

export function LoginPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>KeyNexus</h1>
        <p>智能密钥保险箱 · 零知识加密，安全同步</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => signInWithGoogle()}
          style={{ width: '100%', padding: '12px' }}
        >
          使用 Google 登录
        </button>
      </div>
    </div>
  )
}
