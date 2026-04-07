'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { encrypt } from '@/lib/crypto'
import { logError } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase/client'

/**
 * 密钥录入表单组件
 */
export function KeyForm() {
  const { user } = useAuth()
  const { masterPassword } = useMasterPassword()
  const { showToast } = useToast()
  const supabase = useMemo(() => createBrowserClient(), [])

  const [type, setType] = useState<'simple' | 'pair'>('simple')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const [simpleKey, setSimpleKey] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      showToast('请先登录', 'error')
      return
    }

    if (!masterPassword) {
      showToast('主密码未设置', 'error')
      return
    }

    setLoading(true)
    try {
      const payload = type === 'simple' ? { key: simpleKey } : { appId, appSecret }

      const { ciphertext, iv, salt } = await encrypt(masterPassword, payload)

      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name,
        type,
        encrypted_payload: ciphertext,
        iv,
        salt,
      })

      if (error) throw error

      setName('')
      setSimpleKey('')
      setAppId('')
      setAppSecret('')
      window.dispatchEvent(new CustomEvent('vault:refresh'))
      showToast('已安全保存')
    } catch (err) {
      logError('Failed to save key', err)
      showToast('保存失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="form-card animate-fade-in">
      <div className="tabs">
        <button
          type="button"
          className={`tab ${type === 'simple' ? 'active' : ''}`}
          onClick={() => setType('simple')}
        >
          单密钥
        </button>
        <button
          type="button"
          className={`tab ${type === 'pair' ? 'active' : ''}`}
          onClick={() => setType('pair')}
        >
          ID + 密钥
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>名称</label>
          <input
            className="input"
            placeholder="如：OpenAI、AWS 生产环境..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-dynamic-area">
          <div
            style={{
              gridArea: '1/1',
              visibility: type === 'simple' ? 'visible' : 'hidden',
              pointerEvents: type === 'simple' ? 'auto' : 'none',
            }}
          >
            <div className="form-group">
              <label>API 密钥</label>
              <input
                className="input"
                type="password"
                placeholder="sk-..."
                value={simpleKey}
                onChange={(e) => setSimpleKey(e.target.value)}
                required={type === 'simple'}
                tabIndex={type === 'simple' ? 0 : -1}
              />
            </div>
          </div>
          <div
            style={{
              gridArea: '1/1',
              visibility: type === 'pair' ? 'visible' : 'hidden',
              pointerEvents: type === 'pair' ? 'auto' : 'none',
            }}
          >
            <div className="form-group">
              <label>应用 ID</label>
              <input
                className="input"
                placeholder="输入 ID"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                required={type === 'pair'}
                tabIndex={type === 'pair' ? 0 : -1}
              />
            </div>
            <div className="form-group">
              <label>应用密钥</label>
              <input
                className="input"
                type="password"
                placeholder="输入密钥"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                required={type === 'pair'}
                tabIndex={type === 'pair' ? 0 : -1}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '8px' }}
          disabled={loading || (type === 'simple' ? !simpleKey : !appId || !appSecret) || !name}
        >
          {loading ? '保存中...' : '安全保存'}
        </button>
      </form>
    </section>
  )
}
