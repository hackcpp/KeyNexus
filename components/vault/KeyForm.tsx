'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMasterPassword } from '@/components/providers/MasterPasswordProvider'
import { useToast } from '@/components/providers/ToastProvider'
import {
  encrypt,
  decrypt,
  type PayloadData,
  type SimpleData,
  type PairData,
  type UserPassData,
} from '@/lib/crypto'
import { logError } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase/client'

export type EditKeyData = {
  id: string
  name: string
  type: 'simple' | 'pair' | 'userpass'
  encrypted_payload: string
  iv: string
  salt: string
}

type KeyFormProps = {
  editData?: EditKeyData | null
  onCancel?: () => void
}

/**
 * 密钥录入表单组件（支持新增和编辑）
 */
export function KeyForm({ editData, onCancel }: KeyFormProps) {
  const { user } = useAuth()
  const { masterPassword } = useMasterPassword()
  const { showToast } = useToast()
  const supabase = useMemo(() => createBrowserClient(), [])

  const isEditMode = !!editData
  const [type, setType] = useState<'simple' | 'pair' | 'userpass'>(editData?.type || 'simple')
  const [name, setName] = useState(editData?.name || '')
  const [loading, setLoading] = useState(false)

  const [simpleKey, setSimpleKey] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showSimpleKey, setShowSimpleKey] = useState(false)
  const [showAppSecret, setShowAppSecret] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  type InitialValues = {
    name: string
    type: 'simple' | 'pair' | 'userpass'
    simpleKey: string
    appId: string
    appSecret: string
    username: string
    password: string
  }

  const initialValuesRef = useRef<InitialValues>({
    name: '',
    type: 'simple',
    simpleKey: '',
    appId: '',
    appSecret: '',
    username: '',
    password: '',
  })

  // 当 editData 变化时，更新表单状态
  useEffect(() => {
    if (editData) {
      setType(editData.type)
      setName(editData.name)
      setSimpleKey('')
      setAppId('')
      setAppSecret('')
      setUsername('')
      setPassword('')
      initialValuesRef.current = {
        name: editData.name,
        type: editData.type,
        simpleKey: '',
        appId: '',
        appSecret: '',
        username: '',
        password: '',
      }
      if (masterPassword) {
        loadEditData()
      }
    } else {
      const defaultValues = {
        name: '',
        type: 'simple' as const,
        simpleKey: '',
        appId: '',
        appSecret: '',
        username: '',
        password: '',
      }
      setType(defaultValues.type)
      setName(defaultValues.name)
      setSimpleKey(defaultValues.simpleKey)
      setAppId(defaultValues.appId)
      setAppSecret(defaultValues.appSecret)
      setUsername(defaultValues.username)
      setPassword(defaultValues.password)
      initialValuesRef.current = defaultValues
    }
  }, [editData])

  // 检测是否有修改
  const hasChanges = useMemo(() => {
    const current = initialValuesRef.current
    if (current.name !== name) return true
    if (current.type !== type) return true
    if (type === 'simple' && current.simpleKey !== simpleKey) return true
    if (type === 'pair' && (current.appId !== appId || current.appSecret !== appSecret)) return true
    if (type === 'userpass' && (current.username !== username || current.password !== password))
      return true
    return false
  }, [name, type, simpleKey, appId, appSecret, username, password])

  // 监听 ESC 键（仅编辑模式）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditMode) {
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditMode])

  // 处理取消
  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm('有未保存的修改，确定要关闭吗？')
      if (!confirmCancel) return
    }
    onCancel?.()
  }

  // 当 masterPassword 可用且在编辑模式时，解密密钥内容
  useEffect(() => {
    if (isEditMode && masterPassword && editData) {
      loadEditData()
    }
  }, [isEditMode, masterPassword, editData])

  const loadEditData = async () => {
    if (!masterPassword || !editData) return

    try {
      const data = await decrypt<PayloadData>(masterPassword, {
        ciphertext: editData.encrypted_payload,
        iv: editData.iv,
        salt: editData.salt,
      })

      if (editData.type === 'simple') {
        const keyValue = (data as SimpleData).key
        setSimpleKey(keyValue)
        initialValuesRef.current.simpleKey = keyValue
      } else if (editData.type === 'pair') {
        const pairData = data as PairData
        setAppId(pairData.appId)
        setAppSecret(pairData.appSecret)
        initialValuesRef.current.appId = pairData.appId
        initialValuesRef.current.appSecret = pairData.appSecret
      } else {
        const userPassData = data as UserPassData
        setUsername(userPassData.username)
        setPassword(userPassData.password)
        initialValuesRef.current.username = userPassData.username
        initialValuesRef.current.password = userPassData.password
      }
    } catch (error) {
      logError('Failed to decrypt key for editing', error)
      showToast('解密失败，无法编辑', 'error')
      onCancel?.()
    }
  }

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
      const payload =
        type === 'simple'
          ? { key: simpleKey }
          : type === 'pair'
            ? { appId, appSecret }
            : { username, password }

      const { ciphertext, iv, salt } = await encrypt(masterPassword, payload)

      if (isEditMode && editData) {
        const { error } = await supabase
          .from('api_keys')
          .update({
            name,
            type,
            encrypted_payload: ciphertext,
            iv,
            salt,
          })
          .eq('id', editData.id)

        if (error) throw error
        showToast('已更新')
      } else {
        const { error } = await supabase.from('api_keys').insert({
          user_id: user.id,
          name,
          type,
          encrypted_payload: ciphertext,
          iv,
          salt,
        })

        if (error) throw error
        showToast('已安全保存')
      }

      initialValuesRef.current = {
        name,
        type,
        simpleKey,
        appId,
        appSecret,
        username,
        password,
      }
      setName('')
      setSimpleKey('')
      setAppId('')
      setAppSecret('')
      setUsername('')
      setPassword('')
      window.dispatchEvent(new CustomEvent('vault:refresh'))
      onCancel?.()
    } catch (err) {
      logError('Failed to save key', err)
      showToast('保存失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="form-card animate-fade-in">
      <div className="form-header">
        <h3>{isEditMode ? '编辑密钥' : '添加密钥'}</h3>
        {isEditMode && onCancel && (
          <button
            type="button"
            className="btn btn-ghost btn-cancel"
            onClick={handleCancel}
            title="关闭 (ESC)"
          >
            ✕
          </button>
        )}
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${type === 'simple' ? 'active' : ''}`}
          onClick={() => setType('simple')}
          disabled={isEditMode}
        >
          单密钥
        </button>
        <button
          type="button"
          className={`tab ${type === 'pair' ? 'active' : ''}`}
          onClick={() => setType('pair')}
          disabled={isEditMode}
        >
          ID + 密钥
        </button>
        <button
          type="button"
          className={`tab ${type === 'userpass' ? 'active' : ''}`}
          onClick={() => setType('userpass')}
          disabled={isEditMode}
        >
          用户名/密码
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
              <div className="input-with-toggle">
                <input
                  className="input"
                  type={showSimpleKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={simpleKey}
                  onChange={(e) => setSimpleKey(e.target.value)}
                  required={type === 'simple'}
                  tabIndex={type === 'simple' ? 0 : -1}
                />
                <button
                  type="button"
                  className={`toggle-btn ${showSimpleKey ? 'visible' : ''}`}
                  onClick={() => setShowSimpleKey(!showSimpleKey)}
                  title={showSimpleKey ? '隐藏密钥' : '显示密钥'}
                >
                  {showSimpleKey ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M13.87 18.82a10.05 10.05 0 0 1-1.27 2.81" />
                      <path d="M9.87 14.82A6.03 6.03 0 0 1 9 14c0-2.21 1.79-4 4-4 1.17 0 2.2.58 2.87 1.5" />
                      <path d="m15 12-3-3-3 3" />
                      <path d="M12 19c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
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
              <div className="input-with-toggle">
                <input
                  className="input"
                  type={showAppSecret ? 'text' : 'password'}
                  placeholder="输入密钥"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  required={type === 'pair'}
                  tabIndex={type === 'pair' ? 0 : -1}
                />
                <button
                  type="button"
                  className={`toggle-btn ${showAppSecret ? 'visible' : ''}`}
                  onClick={() => setShowAppSecret(!showAppSecret)}
                  title={showAppSecret ? '隐藏密钥' : '显示密钥'}
                >
                  {showAppSecret ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M13.87 18.82a10.05 10.05 0 0 1-1.27 2.81" />
                      <path d="M9.87 14.82A6.03 6.03 0 0 1 9 14c0-2.21 1.79-4 4-4 1.17 0 2.2.58 2.87 1.5" />
                      <path d="m15 12-3-3-3 3" />
                      <path d="M12 19c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div
            style={{
              gridArea: '1/1',
              visibility: type === 'userpass' ? 'visible' : 'hidden',
              pointerEvents: type === 'userpass' ? 'auto' : 'none',
            }}
          >
            <div className="form-group">
              <label>用户名</label>
              <input
                className="input"
                type="text"
                placeholder="输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={type === 'userpass'}
                tabIndex={type === 'userpass' ? 0 : -1}
              />
            </div>
            <div className="form-group">
              <label>密码</label>
              <div className="input-with-toggle">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={type === 'userpass'}
                  tabIndex={type === 'userpass' ? 0 : -1}
                />
                <button
                  type="button"
                  className={`toggle-btn ${showPassword ? 'visible' : ''}`}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M13.87 18.82a10.05 10.05 0 0 1-1.27 2.81" />
                      <path d="M9.87 14.82A6.03 6.03 0 0 1 9 14c0-2.21 1.79-4 4-4 1.17 0 2.2.58 2.87 1.5" />
                      <path d="m15 12-3-3-3 3" />
                      <path d="M12 19c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '8px' }}
          disabled={
            loading ||
            (type === 'simple'
              ? !simpleKey
              : type === 'pair'
                ? !appId || !appSecret
                : !username || !password) ||
            !name
          }
        >
          {loading ? '保存中...' : isEditMode ? '保存修改' : '安全保存'}
        </button>
      </form>
    </section>
  )
}
