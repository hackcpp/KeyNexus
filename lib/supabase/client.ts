import { createClient } from '@supabase/supabase-js'

/**
 * 创建 Supabase 浏览器客户端
 *
 * 使用环境变量配置：
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase 项目 URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase 匿名密钥
 *
 * @returns 配置好的 Supabase 客户端实例
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 如果环境变量缺失，且是在非构建环境下运行，则报错
  // 在构建环境下（Prerendering），我们允许缺失，以避免构建失败
  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.error('Missing Supabase environment variables. Check your .env.local file.')
    }
    // 返回一个空的或者最小化的 client 占位符，避免在构建时崩溃
    // 但这可能导致调用其方法时报错。更安全的做法是返回 null，并让调用方处理
    // 不过由于现有代码很多地方直接解构使用，这里返回一个空的 createClient 逻辑
    return createClient(url || 'http://localhost:54321', key || 'placeholder')
  }

  return createClient(url, key)
}
