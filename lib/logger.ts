/**
 * 日志服务
 *
 * 提供统一的错误报告机制：
 * - 开发环境：输出到控制台
 * - 生产环境：可以扩展为发送到错误追踪服务（如 Sentry）
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

const isDev = process.env.NODE_ENV === 'development'

function formatLog(entry: LogEntry): string {
  const { level, message, timestamp, context } = entry
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  }
}

/**
 * 记录信息日志
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  const entry = createLogEntry('info', message, context)

  if (isDev) {
    console.log(formatLog(entry))
  }
}

/**
 * 记录警告日志
 */
export function logWarn(message: string, context?: Record<string, unknown>): void {
  const entry = createLogEntry('warn', message, context)

  if (isDev) {
    console.warn(formatLog(entry))
  }
}

/**
 * 记录错误日志
 *
 * @param message - 错误消息
 * @param error - 错误对象（可选）
 * @param context - 额外上下文信息（可选）
 */
export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const fullMessage = error ? `${message}: ${errorMessage}` : message

  const entry = createLogEntry('error', fullMessage, context)

  if (isDev) {
    console.error(formatLog(entry))
    if (error && error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
  }

  // 生产环境可以扩展为发送到错误追踪服务
  // if (!isDev) { sendToErrorTracker(entry) }
}
