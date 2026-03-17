'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useCallback, useMemo } from 'react'

/**
 * 页面头部组件
 * 显示用户信息和登出按钮
 */
export function Header() {
  const { user, signOut } = useAuth()

  /**
   * 处理用户登出
   */
  const handleLogout = useCallback(() => {
    signOut()
  }, [signOut])

  /**
   * 获取用户显示信息
   */
  const userInfo = useMemo(() => {
    if (!user) return null
    
    const metadata = user.user_metadata || {}
    const displayName = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User'
    const avatarUrl = metadata.avatar_url
    const email = user.email || ''
    
    return {
      displayName,
      avatarUrl,
      email,
    }
  }, [user])

  if (!userInfo) return null

  return (
    <header className="header animate-fade-in">
      <div className="header-user-info">
        {/* 用户头像 */}
        {userInfo.avatarUrl ? (
          <img 
            src={userInfo.avatarUrl} 
            alt={userInfo.displayName}
            className="user-avatar"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {userInfo.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* 用户名和邮箱 */}
        <div className="user-details">
          <span className="user-name">{userInfo.displayName}</span>
          <span className="user-email">{userInfo.email}</span>
        </div>
        
        {/* 登录状态指示器 */}
        <span className="login-status" title="已登录">
          <span className="status-dot"></span>
          在线
        </span>
      </div>
      
      <button
        type="button"
        className="btn btn-ghost"
        onClick={handleLogout}
        style={{ fontWeight: 600, gap: '8px' }}
      >
        <span>Sign Out</span>
        <span aria-hidden="true">↗</span>
      </button>
    </header>
  )
}
