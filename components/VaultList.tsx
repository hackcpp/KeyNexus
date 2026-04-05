'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { useToast } from '@/components/providers/ToastProvider'
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
  onDelete: (id: string) => Promise<void>
}

function KeyItem({ item, onDelete }: KeyItemProps) {
  const { showToast } = useToast()
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
        salt: item.salt,
      })

      // 2. 获取目标内容
      let text = ''
      let fieldLabel = ''
      if (item.type === 'simple') {
        text = (data as SimpleData).key
        fieldLabel = '密钥'
      } else {
        text = field === 'appId' ? (data as PairData).appId : (data as PairData).appSecret
        fieldLabel = field === 'appId' ? 'ID' : '密钥'
      }

      await navigator.clipboard.writeText(text)

      showToast(`${fieldLabel} 已复制到剪贴板`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '解密失败', 'error')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(item.id)
      showToast('已删除')
    } catch {
      showToast('删除失败', 'error')
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
          <span>添加于 {new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>

      <div className="actions">
        {item.type === 'simple' ? (
          <button
            className="btn btn-secondary btn-copy"
            onClick={() => handleCopy('key')}
            disabled={!isUnlocked}
            title="复制密钥"
          >
            🔑 密钥
          </button>
        ) : (
          <>
            <button
              className="btn btn-secondary btn-copy"
              onClick={() => handleCopy('appId')}
              disabled={!isUnlocked}
              title="复制 ID"
            >
              🏷️ ID
            </button>
            <button
              className="btn btn-secondary btn-copy"
              onClick={() => handleCopy('appSecret')}
              disabled={!isUnlocked}
              title="复制密钥"
            >
              🔒 密钥
            </button>
          </>
        )}

        {!showConfirm ? (
          <button className="btn btn-danger" onClick={() => setShowConfirm(true)} title="删除">
            🗑️
          </button>
        ) : (
          <div className="confirm-actions">
            <button
              className="btn btn-danger btn-confirm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '...' : '确认'}
            </button>
            <button
              className="btn btn-secondary btn-confirm"
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
            >
              取消
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
  const [search, setSearch] = useState('')
  const supabase = useMemo(() => createBrowserClient(), [])

  const filteredKeys = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return keys

    const tokens = query.split(/\s+/)

    return keys.filter((item) => {
      const haystack = [
        item.name,
        item.type,
        item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
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
    const { error } = await supabase.from('api_keys').delete().eq('id', id)

    if (error) {
      alert('删除失败：' + error.message)
    } else {
      // 本地同步移除已删除的条目，避免整列表重新加载带来的抖动
      setKeys((prev) => prev.filter((item) => item.id !== id))
    }
  }

  useEffect(() => {
    fetchKeys()

    // 监听刷新事件（例如在添加新 Key 后）
    const handleRefresh = () => fetchKeys()
    window.addEventListener('vault:refresh', handleRefresh)
    return () => window.removeEventListener('vault:refresh', handleRefresh)
  }, [user, supabase])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        加载中...
      </div>
    )
  }

  return (
    <section className="vault-section">
      <div className="vault-header">
        <h2 className="vault-title">密钥列表</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索名称/类型..."
            style={{
              maxWidth: '220px',
              fontSize: '12px',
              borderRadius: '999px',
            }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {filteredKeys.length} / {keys.length} 项
          </span>
        </div>
      </div>

      {filteredKeys.length === 0 ? (
        <div className="empty-state">
          {keys.length === 0
            ? '暂无密钥，在上方添加第一个密钥吧！'
            : '未找到匹配的密钥'}
        </div>
      ) : (
        <div className="vault-grid">
          {filteredKeys.map((item) => (
            <KeyItem key={item.id} item={item} onDelete={handleDeleteKey} />
          ))}
        </div>
      )}
    </section>
  )
}
