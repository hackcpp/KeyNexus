'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase/client'

/**
 * 认证上下文接口
 * 提供用户认证状态和相关操作方法
 */
interface AuthContextValue {
  user: User | null          // 当前登录用户，null表示未登录
  loading: boolean           // 认证状态加载中
  signInWithGoogle: () => Promise<void>  // Google OAuth 登录
  signInWithGithub: () => Promise<void>  // GitHub OAuth 登录
  signOut: () => Promise<void>           // 退出登录
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * 认证提供者组件
 * 管理 Supabase 认证状态，提供登录/登出功能
 *
 * 功能：
 * - 初始化时获取当前会话
 * - 监听认证状态变化
 * - 提供 Google OAuth 登录
 * - 处理用户登出
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createBrowserClient(), [])

  useEffect(() => {
    // 获取初始会话状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  /**
   * Google OAuth 登录
   * 重定向到 Google 登录页面，成功后返回应用首页
   */
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  /**
   * GitHub OAuth 登录
   * 重定向到 GitHub 登录页面，成功后返回应用首页
   */
  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  /**
   * 用户登出
   * 清除 Supabase 会话并重置用户状态
   */
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signInWithGithub, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
