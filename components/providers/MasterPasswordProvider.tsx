'use client'

import { createContext, useContext, useCallback, useState, useEffect } from 'react'

const STORAGE_KEY = 'keynexus_master_password'

interface MasterPasswordContextValue {
  masterPassword: string | null
  setMasterPassword: (pwd: string | null) => void
  isUnlocked: boolean
  clearMasterPassword: () => void
}

const MasterPasswordContext = createContext<MasterPasswordContextValue | null>(null)

export function MasterPasswordProvider({ children }: { children: React.ReactNode }) {
  const [masterPassword, setMasterPasswordState] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) setMasterPasswordState(stored)
  }, [mounted])

  const setMasterPassword = useCallback((pwd: string | null) => {
    if (pwd === null) {
      sessionStorage.removeItem(STORAGE_KEY)
      setMasterPasswordState(null)
    } else {
      sessionStorage.setItem(STORAGE_KEY, pwd)
      setMasterPasswordState(pwd)
    }
  }, [])

  const clearMasterPassword = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setMasterPasswordState(null)
  }, [])

  return (
    <MasterPasswordContext.Provider
      value={{
        masterPassword,
        setMasterPassword,
        isUnlocked: !!masterPassword,
        clearMasterPassword,
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
