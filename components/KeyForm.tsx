'use client'

import { useState, useMemo } from 'react'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { encrypt } from '@/lib/crypto'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { logError } from '@/lib/logger'

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

  // 表单数据状态
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
      // 1. 准备加密载荷
      const payload = type === 'simple' ? { key: simpleKey } : { appId, appSecret }

      // 2. 客户端加密
      const { ciphertext, iv, salt } = await encrypt(masterPassword, payload)

      // 3. 存储到 Supabase
      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name,
        type,
        encrypted_payload: ciphertext,
        iv,
        salt,
      })

      if (error) throw error

      // 4. 重置表单并触发刷新
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
          className={`tab ${type === 'simple' ? 'active' : ''}`}
          onClick={() => setType('simple')}
        >
          单密钥
        </button>
        <button
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

        <div className={`form-dynamic-area ${type}`}>
          {type === 'simple' ? (
            <div className="form-group animate-fade-in">
              <label>API 密钥</label>
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
                <label>应用 ID</label>
                <input
                  className="input"
                  placeholder="输入 ID"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  required
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
          disabled={loading || (type === 'simple' ? !simpleKey : !appId || !appSecret) || !name}
        >
          {loading ? '保存中...' : '安全保存'}
        </button>
      </form>
    </section>
  )
}
