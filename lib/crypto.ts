/**
 * SoloBiz 客户端加密模块
 * 零知识架构：PBKDF2 + AES-GCM，所有加解密在浏览器完成
 *
 * 安全特性：
 * - PBKDF2-HMAC-SHA256 密钥派生 (310,000 次迭代)
 * - AES-GCM 256-bit 加密 (带认证加密)
 * - 随机盐和初始化向量
 * - 客户端零知识：服务器永不接触明文
 */

// 加密参数配置
const PBKDF2_ITERATIONS = 310000 // PBKDF2 迭代次数，提高安全性
const SALT_LENGTH = 16 // 盐长度 (16 字节)
const IV_LENGTH = 12 // GCM 初始化向量长度 (12 字节)
const KEY_LENGTH = 256 // AES 密钥长度 (256 位)

/**
 * 将 ArrayBuffer 或 Uint8Array 转换为 Base64 字符串
 * @param buffer 要转换的二进制数据
 * @returns Base64 编码的字符串
 */
function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return btoa(String.fromCharCode(...array))
}

/**
 * 将 Base64 字符串转换为 Uint8Array
 * @param str Base64 编码的字符串
 * @returns 解码后的字节数组
 */
function fromBase64(str: string): Uint8Array {
  return new Uint8Array(
    atob(str)
      .split('')
      .map((c) => c.charCodeAt(0))
  )
}

/**
 * 从密码派生 AES-GCM 加密密钥
 * 使用 PBKDF2 算法将用户密码转换为加密密钥
 *
 * @param password 用户主密码
 * @param salt 随机盐值
 * @returns AES-GCM 加密密钥
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()

  // 将密码导入为 PBKDF2 密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // 派生 AES-GCM 密钥
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export interface EncryptedPayload {
  ciphertext: string
  iv: string
  salt: string
}

export interface SimpleData {
  key: string
}

export interface PairData {
  appId: string
  appSecret: string
}

export type PayloadData = SimpleData | PairData

/**
 * 加密函数：将 JSON 数据加密为 Base64 密文
 *
 * 加密流程：
 * 1. 生成随机盐和初始化向量
 * 2. 从密码派生 AES-GCM 密钥
 * 3. 使用 AES-GCM 加密数据
 * 4. 返回包含密文、IV 和盐的加密载荷
 *
 * @param password 用户主密码
 * @param data 要加密的 JSON 数据
 * @returns 加密后的载荷，包含密文、IV 和盐
 */
export async function encrypt(
  password: string,
  data: Record<string, unknown>
): Promise<EncryptedPayload> {
  // 生成随机盐和初始化向量
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  // 从密码派生加密密钥
  const key = await deriveKey(password, salt as Uint8Array)

  // 将数据序列化为 JSON 字符串
  const payload = JSON.stringify(data)

  // 使用 AES-GCM 加密数据
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    key,
    new TextEncoder().encode(payload)
  )

  // 返回 Base64 编码的加密载荷
  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    salt: toBase64(salt),
  }
}

/**
 * 解密函数：从 Base64 密文还原 JSON 数据
 *
 * 解密流程：
 * 1. 从 Base64 解码盐、IV 和密文
 * 2. 从密码重新派生 AES-GCM 密钥
 * 3. 使用 AES-GCM 解密数据
 * 4. 验证数据完整性并反序列化 JSON
 *
 * @param password 用户主密码
 * @param encrypted 加密载荷，包含密文、IV 和盐
 * @returns 解密后的原始 JSON 数据
 * @throws 当密码错误或数据损坏时抛出错误
 */
export async function decrypt<T = PayloadData>(
  password: string,
  encrypted: EncryptedPayload
): Promise<T> {
  // 从 Base64 解码加密参数
  const salt = fromBase64(encrypted.salt)
  const iv = fromBase64(encrypted.iv)
  const ciphertext = fromBase64(encrypted.ciphertext)

  // 从密码重新派生解密密钥
  const key = await deriveKey(password, salt as Uint8Array)

  try {
    // 使用 AES-GCM 解密数据
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
        tagLength: 128,
      },
      key,
      ciphertext as BufferSource
    )

    // 将解密后的字节转换为 JSON 字符串
    const json = new TextDecoder().decode(decrypted)

    // 反序列化为原始数据结构
    return JSON.parse(json) as T
  } catch {
    // AES-GCM 解密失败表示密码错误或数据损坏
    throw new Error('密码校验失败')
  }
}
