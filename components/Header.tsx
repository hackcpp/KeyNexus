'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useCallback } from 'react'

/**
 * 页面头部组件
 * 显示用户信息和登出按钮
 */
export function Header() {
  const { signOut } = useAuth()

  /**
   * 处理用户登出
   */
  const handleLogout = useCallback(() => {
    signOut()
  }, [signOut])

  return (
    <header className="header animate-fade-in">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={handleLogout}
        style={{ marginLeft: 'auto', fontWeight: 600, gap: '8px' }}
      >
        <span>Sign Out</span>
        <span aria-hidden="true">↗</span>
      </button>
    </header>
  )
}
