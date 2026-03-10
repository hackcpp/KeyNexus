'use client'

import { useState, useMemo } from 'react'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { encrypt } from '@/lib/crypto'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'

/**
 * 密钥录入表单组件
 */
export function KeyForm() {
  const { user } = useAuth()
  const { masterPassword } = useMasterPassword()
  const supabase = useMemo(() => createBrowserClient(), [])
  
  const [type, setType] = useState<'simple' | 'pair'>('simple')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  // 表单数据状态
  const [simpleKey, setSimpleKey] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      showToast('Please sign in first', 'error')
      return
    }

    if (!masterPassword) {
      showToast('Master Password not set', 'error')
      return
    }

    setLoading(true)
    try {
      // 1. 准备加密载荷
      const payload = type === 'simple'
        ? { key: simpleKey }
        : { appId, appSecret }

      // 2. 客户端加密
      const { ciphertext, iv, salt } = await encrypt(
        masterPassword,
        payload
      )

      // 3. 存储到 Supabase
      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name,
        type,
        encrypted_payload: ciphertext,
        iv,
        salt
      })

      if (error) throw error

      // 4. 重置表单并触发刷新
      setName('')
      setSimpleKey('')
      setAppId('')
      setAppSecret('')
      window.dispatchEvent(new CustomEvent('keynexus:refresh'))
      showToast('Saved securely!')
    } catch (err) {
      console.error('Save failed:', err)
      showToast('Failed to save key', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="form-card animate-fade-in">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
      <div className="tabs">
        <button
          className={`tab ${type === 'simple' ? 'active' : ''}`}
          onClick={() => setType('simple')}
        >
          Simple Key
        </button>
        <button
          className={`tab ${type === 'pair' ? 'active' : ''}`}
          onClick={() => setType('pair')}
        >
          ID + Secret
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            className="input"
            placeholder="e.g. OpenAI, AWS Production..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={`form-dynamic-area ${type}`}>
          {type === 'simple' ? (
            <div className="form-group animate-fade-in">
              <label>API Key</label>
              <input
                className="input"
                type="password"
                placeholder="sk-..."
                value={simpleKey}
                onChange={(e) => setSimpleKey(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="form-group">
                <label>App ID / Client ID</label>
                <input
                  className="input"
                  placeholder="Enter ID"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>App Secret</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Enter Secret"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '8px' }}
          disabled={loading || (type === 'simple' ? !simpleKey : (!appId || !appSecret)) || !name}
        >
          {loading ? 'Saving...' : 'Securely Save'}
        </button>
      </form>
    </section>
  )
}
