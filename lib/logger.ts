/**
 * 错误日志：开发环境输出控制台，生产可接 Sentry 等
 */

const isDev = process.env.NODE_ENV === 'development'

export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): void {
  if (!isDev) return

  const errorMessage = error instanceof Error ? error.message : String(error)
  const fullMessage = error ? `${message}: ${errorMessage}` : message
  const ts = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  console.error(`[${ts}] [ERROR] ${fullMessage}${contextStr}`)
  if (error instanceof Error && error.stack) {
    console.error('Stack trace:', error.stack)
  }
}
