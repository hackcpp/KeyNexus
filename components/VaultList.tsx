'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { decrypt, type PayloadData, type SimpleData, type PairData } from '@/lib/crypto'
import { createBrowserClient } from '@/lib/supabase/client'

/**
 * 密钥列表项组件
 */
type KeyItemProps = {
  item: {
    id: string
    name: string
    type: 'simple' | 'pair'
    encrypted_payload: string
    iv: string
    salt: string
    created_at: string
  }
  onDelete: (id: string) => Promise<void>,
  onShowToast: (msg: string, type?: 'success' | 'error') => void
}

function KeyItem({ item, onDelete, onShowToast }: KeyItemProps) {
  const { masterPassword, isUnlocked } = useMasterPassword()
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!showConfirm) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setShowConfirm(false)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        if (!deleting) {
          handleDelete()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showConfirm, deleting])

  const handleCopy = async (field: 'key' | 'appId' | 'appSecret') => {
    if (!masterPassword) return

    try {
      // 1. 解密数据
      const data = await decrypt<PayloadData>(masterPassword, {
        ciphertext: item.encrypted_payload,
        iv: item.iv,
        salt: item.salt
      })

      // 2. 获取目标内容
      let text = ''
      let fieldLabel = ''
      if (item.type === 'simple') {
        text = (data as SimpleData).key
        fieldLabel = 'Key'
      } else {
        text = field === 'appId' ? (data as PairData).appId : (data as PairData).appSecret
        fieldLabel = field === 'appId' ? 'ID' : 'Secret'
      }

      // 3. 复制到剪贴板
      await navigator.clipboard.writeText(text)
      
      // 4. 显示 Toast 反馈
      onShowToast(`${fieldLabel} copied to clipboard`)
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Decryption failed', 'error')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(item.id)
      onShowToast('Deleted successfully')
    } catch {
      onShowToast('Failed to delete key', 'error')
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="key-card animate-fade-in">
      <div className="key-info">
        <div className="key-name">{item.name}</div>
        <div className="key-meta">
          <span className="badge">{item.type}</span>
          <span>Added on {new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="actions">
        {item.type === 'simple' ? (
          <button
            className="btn btn-secondary btn-copy"
            onClick={() => handleCopy('key')}
            disabled={!isUnlocked}
            title="Copy API Key"
          >
            🔑 Key
          </button>
        ) : (
          <>
            <button
              className="btn btn-secondary btn-copy"
              onClick={() => handleCopy('appId')}
              disabled={!isUnlocked}
              title="Copy ID"
            >
              🏷️ ID
            </button>
            <button
              className="btn btn-secondary btn-copy"
              onClick={() => handleCopy('appSecret')}
              disabled={!isUnlocked}
              title="Copy Secret"
            >
              🔒 Secret
            </button>
          </>
        )}

        {!showConfirm ? (
          <button
            className="btn btn-danger"
            onClick={() => setShowConfirm(true)}
            title="Delete"
          >
            🗑️
          </button>
        ) : (
          <div className="confirm-actions">
            <button 
              className="btn btn-danger btn-confirm" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '...' : 'Confirm'}
            </button>
            <button 
              className="btn btn-secondary btn-confirm" 
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 密钥库列表组件
 */
export function VaultList() {
  const { user } = useAuth()
  const [keys, setKeys] = useState<KeyItemProps['item'][]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [search, setSearch] = useState('')
  const supabase = useMemo(() => createBrowserClient(), [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }

  const filteredKeys = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return keys

    const tokens = query.split(/\s+/)

    return keys.filter((item) => {
      const haystack = [
        item.name,
        item.type,
        item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
      ]
        .join(' ')
        .toLowerCase()

      return tokens.every((token) => haystack.includes(token))
    })
  }, [keys, search])

  const fetchKeys = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setKeys(data)
    }
    setLoading(false)
  }

  const handleDeleteKey = async (id: string) => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      // 本地同步移除已删除的条目，避免整列表重新加载带来的抖动
      setKeys((prev) => prev.filter((item) => item.id !== id))
    }
  }

  useEffect(() => {
    fetchKeys()

    // 监听刷新事件（例如在添加新 Key 后）
    const handleRefresh = () => fetchKeys()
    window.addEventListener('keynexus:refresh', handleRefresh)
    return () => window.removeEventListener('keynexus:refresh', handleRefresh)
  }, [user, supabase])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading vault...</div>
  }

  return (
    <section className="vault-section">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
      <div className="vault-header">
        <h2 className="vault-title">Your Vault</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name / type..."
            style={{
              maxWidth: '220px',
              fontSize: '12px',
              borderRadius: '999px'
            }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {filteredKeys.length} / {keys.length} items
          </span>
        </div>
      </div>

      {filteredKeys.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
          color: 'var(--text-muted)'
        }}>
          {keys.length === 0
            ? 'No keys found. Add your first secret above!'
            : 'No keys matched your search.'}
        </div>
      ) : (
        <div className="vault-grid">
          {filteredKeys.map((item) => (
            <KeyItem key={item.id} item={item} onDelete={handleDeleteKey} onShowToast={showToast} />
          ))}
        </div>
      )}
    </section>
  )
}
