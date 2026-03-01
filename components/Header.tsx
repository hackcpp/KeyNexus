'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { useCallback, useState } from 'react'

export function Header() {
  const { user, signOut } = useAuth()
  const { masterPassword, setMasterPassword, isUnlocked, clearMasterPassword } = useMasterPassword()
  const [inputValue, setInputValue] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const val = inputValue.trim()
      if (val) {
        setMasterPassword(val)
        setInputValue('')
      }
    },
    [inputValue, setMasterPassword]
  )

  const handleLogout = useCallback(() => {
    clearMasterPassword()
    signOut()
  }, [clearMasterPassword, signOut])

  const email = user?.email ?? ''
  const displayEmail = email.length > 24 ? email.slice(0, 21) + '...' : email

  return (
    <header className="header">
      <div className="header-left">
        <span className="user-info">{displayEmail}</span>
        <form className="master-password-wrap" onSubmit={handleSubmit}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="主密码"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label="主密码"
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? '隐藏' : '显示'}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={!inputValue.trim()}>
            {isUnlocked ? '更新' : '解锁'}
          </button>
        </form>
      </div>
      <button type="button" className="btn btn-secondary" onClick={handleLogout}>
        退出
      </button>
    </header>
  )
}
