'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { createBrowserClient } from '@/lib/supabase/client'
import { decrypt } from '@/lib/crypto'
import type { ApiKeyRecord } from '@/types'
import type { SimpleData, PairData } from '@/lib/crypto'

// Mock 数据用于演示
const MOCK_ITEMS: ApiKeyRecord[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'OpenAI API Key',
    type: 'simple',
    encrypted_payload: 'demo',
    iv: 'demo',
    salt: 'demo',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'demo',
    name: 'AWS Access Key',
    type: 'pair',
    encrypted_payload: 'demo',
    iv: 'demo',
    salt: 'demo',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    user_id: 'demo',
    name: 'GitHub Token',
    type: 'simple',
    encrypted_payload: 'demo',
    iv: 'demo',
    salt: 'demo',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
]

export function VaultList() {
  const [items, setItems] = useState<ApiKeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { masterPassword, isUnlocked } = useMasterPassword()
  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(), [])

  const fetchItems = useCallback(async () => {
    // 如果没有登录用户，使用 mock 数据
    if (!user) {
      setItems(MOCK_ITEMS)
      setLoading(false)
      return
    }
    
    setLoading(true)
    const { data, error: err } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
      setItems([])
    } else {
      setError(null)
      setItems(data ?? [])
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    const handler = () => fetchItems()
    window.addEventListener('keynexus:refresh', handler)
    return () => window.removeEventListener('keynexus:refresh', handler)
  }, [fetchItems])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      setError('复制失败')
    }
  }

  const handleCopyKey = async (record: ApiKeyRecord) => {
    if (!masterPassword) return
    setError(null)
    try {
      const data = await decrypt<SimpleData>(masterPassword, {
        ciphertext: record.encrypted_payload,
        iv: record.iv,
        salt: record.salt,
      })
      await copyToClipboard(data.key)
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码校验失败')
    }
  }

  const handleCopyId = async (record: ApiKeyRecord) => {
    if (!masterPassword) return
    setError(null)
    try {
      const data = await decrypt<PairData>(masterPassword, {
        ciphertext: record.encrypted_payload,
        iv: record.iv,
        salt: record.salt,
      })
      await copyToClipboard(data.appId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码校验失败')
    }
  }

  const handleCopySecret = async (record: ApiKeyRecord) => {
    if (!masterPassword) return
    setError(null)
    try {
      const data = await decrypt<PairData>(masterPassword, {
        ciphertext: record.encrypted_payload,
        iv: record.iv,
        salt: record.salt,
      })
      await copyToClipboard(data.appSecret)
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码校验失败')
    }
  }

  const formatDate = (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeLabel = (type: string) => (type === 'simple' ? '简单 Key' : 'ID + Secret')
  const getTypeIcon = (type: string) => (type === 'simple' ? '🔑' : '🔐')

  if (loading) return <div className="vault-section">加载中...</div>

  return (
    <section className="vault-section">
      <h2>密钥库</h2>
      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>
      )}
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>暂无密钥，请先添加</p>
      ) : (
        <div className="vault-list">
          {items.map((record) => (
            <div key={record.id} className="vault-card">
              <div className="vault-card-info">
                <div className="vault-card-icon">{getTypeIcon(record.type)}</div>
                <div className="vault-card-meta">
                  <span className="vault-card-name">{record.name}</span>
                  <span className="vault-card-date">{formatDate(record.created_at)}</span>
                  <span className="vault-card-type">{getTypeLabel(record.type)}</span>
                </div>
              </div>
              <div className="vault-card-actions">
                {record.type === 'simple' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!isUnlocked}
                    onClick={() => handleCopyKey(record)}
                  >
                    复制 Key
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={!isUnlocked}
                      onClick={() => handleCopyId(record)}
                    >
                      复制 ID
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!isUnlocked}
                      onClick={() => handleCopySecret(record)}
                    >
                      复制 Secret
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
