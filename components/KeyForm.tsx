'use client'

import { useState, useMemo } from 'react'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { createBrowserClient } from '@/lib/supabase/client'
import { encrypt } from '@/lib/crypto'
import type { SimpleData, PairData } from '@/lib/crypto'

type TabType = 'simple' | 'pair'

export function KeyForm() {
  const [tab, setTab] = useState<TabType>('simple')
  const [name, setName] = useState('')
  const [simpleKey, setSimpleKey] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { masterPassword, isUnlocked } = useMasterPassword()
  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!masterPassword || !user) {
      setError('请先输入主密码并保持登录')
      return
    }
    if (!name.trim()) {
      setError('请输入服务名称')
      return
    }

    setSubmitting(true)
    try {
      const data: SimpleData | PairData =
        tab === 'simple'
          ? { key: simpleKey }
          : { appId, appSecret }

      const { ciphertext, iv, salt } = await encrypt(masterPassword, data)

      const { error: dbError } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name: name.trim(),
        type: tab,
        encrypted_payload: ciphertext,
        iv,
        salt,
      })

      if (dbError) throw dbError

      setName('')
      setSimpleKey('')
      setAppId('')
      setAppSecret('')
      window.dispatchEvent(new CustomEvent('keynexus:refresh'))
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = isUnlocked && name.trim() && (tab === 'simple' ? simpleKey : appId && appSecret)

  return (
    <div className="form-card">
      <div className="form-tabs">
        <button
          type="button"
          className={`form-tab ${tab === 'simple' ? 'active' : ''}`}
          onClick={() => setTab('simple')}
        >
          简单 Key
        </button>
        <button
          type="button"
          className={`form-tab ${tab === 'pair' ? 'active' : ''}`}
          onClick={() => setTab('pair')}
        >
          ID + Secret
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-fields">
          <div className="form-field">
            <label>服务名称</label>
            <input
              type="text"
              placeholder="如：Github Token"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {tab === 'simple' ? (
            <div className="form-field">
              <label>API Key</label>
              <input
                type="password"
                placeholder="sk-xxx..."
                value={simpleKey}
                onChange={(e) => setSimpleKey(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="form-field">
                <label>App ID</label>
                <input
                  type="text"
                  placeholder="wx..."
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>App Secret</label>
                <input
                  type="password"
                  placeholder="sct..."
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit || submitting}
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
