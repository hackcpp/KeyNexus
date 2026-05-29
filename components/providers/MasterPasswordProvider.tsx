'use client'

import { createContext, useContext, useMemo } from 'react'

/**
 * 主密码上下文接口
 * 提供主密码和解锁状态（环境变量固定模式）
 */
interface MasterPasswordContextValue {
  masterPassword: string | null
  isUnlocked: boolean
}

const MasterPasswordContext = createContext<MasterPasswordContextValue | null>(null)

/**
 * 主密码提供者组件
 *
 * 简化模式：直接从环境变量读取主密码
 * 适用于特定部署环境或简化测试场景
 */
export function MasterPasswordProvider({ children }: { children: React.ReactNode }) {
  const masterPassword = useMemo(() => {
    return process.env.NEXT_PUBLIC_MASTER_PASSWORD || null
  }, [])

  return (
    <MasterPasswordContext.Provider
      value={{
        masterPassword,
        isUnlocked: !!masterPassword,
      }}
    >
      {children}
    </MasterPasswordContext.Provider>
  )
}

export function useMasterPassword() {
  const ctx = useContext(MasterPasswordContext)
  if (!ctx) throw new Error('useMasterPassword must be used within MasterPasswordProvider')
  return ctx
}
