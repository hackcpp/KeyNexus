/**
 * KeyNexus TypeScript 类型定义
 */

/**
 * API 密钥类型枚举
 */
export type ApiKeyType = 'simple' | 'pair'

/**
 * API 密钥数据库记录接口
 * 对应 Supabase api_keys 表的结构
 */
export interface ApiKeyRecord {
  id: string // 记录唯一标识
  user_id: string // 用户 ID (外键)
  name: string // 服务名称
  type: ApiKeyType // 密钥类型
  encrypted_payload: string // 加密后的密钥数据 (Base64)
  iv: string // 初始化向量 (Base64)
  salt: string // PBKDF2 盐值 (Base64)
  created_at: string // 创建时间 (ISO 字符串)
}

/**
 * 简单密钥数据结构
 * 用于存储单个 API 密钥
 */
export interface SimpleData {
  key: string // API 密钥值
}

/**
 * ID+密钥对数据结构
 * 用于存储应用 ID 和对应的密钥
 */
export interface PairData {
  appId: string // 应用 ID
  appSecret: string // 应用密钥
}
