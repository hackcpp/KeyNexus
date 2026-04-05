/**
 * SoloBiz 类型定义
 */

// ========================================
// API Key 模块
// ========================================

export type ApiKeyType = 'simple' | 'pair'

export interface ApiKeyRecord {
  id: string
  user_id: string
  name: string
  type: ApiKeyType
  encrypted_payload: string
  iv: string
  salt: string
  created_at: string
}

export interface SimpleData {
  key: string
}

export interface PairData {
  appId: string
  appSecret: string
}

// ========================================
// 账本模块
// ========================================

export type LedgerType = 'income' | 'expense'

export interface LedgerEntryData {
  type: LedgerType
  amount: number
  category: string
  note: string
  date: string
}

export interface LedgerEntryRecord {
  id: string
  user_id: string
  encrypted_payload: string
  iv: string
  salt: string
  created_at: string
}

export interface DecryptedLedgerEntry extends LedgerEntryData {
  id: string
  created_at: string
}
