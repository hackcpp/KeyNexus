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
import { Tabs, PasswordInput } from '@/components/ui'

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

      <Tabs<'simple' | 'pair' | 'userpass'>
        tabs={[
          { label: '单密钥', value: 'simple' as const },
          { label: 'ID + 密钥', value: 'pair' as const },
          { label: '用户名/密码', value: 'userpass' as const },
        ].map((t) => ({ ...t, disabled: isEditMode }))}
        activeValue={type}
        onTabChange={setType}
      />

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
              <PasswordInput
                className="input"
                placeholder="sk-..."
                value={simpleKey}
                onChange={(e) => setSimpleKey(e.target.value)}
                required={type === 'simple'}
                tabIndex={type === 'simple' ? 0 : -1}
                visible={showSimpleKey}
                onToggle={() => setShowSimpleKey(!showSimpleKey)}
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
              <PasswordInput
                className="input"
                placeholder="输入密钥"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                required={type === 'pair'}
                tabIndex={type === 'pair' ? 0 : -1}
                visible={showAppSecret}
                onToggle={() => setShowAppSecret(!showAppSecret)}
              />
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
              <PasswordInput
                className="input"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={type === 'userpass'}
                tabIndex={type === 'userpass' ? 0 : -1}
                visible={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
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
