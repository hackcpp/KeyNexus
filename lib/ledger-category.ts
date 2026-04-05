/**
 * 分类展示名：去首尾空白，空则为「未分类」。
 */
export function normalizeLedgerCategoryDisplay(raw: string): string {
  return raw.trim() || '未分类'
}

/**
 * 分组键：忽略任意空白（含半角/全角空格），使「AI 工具」与「AI工具」归为同一类。
 */
export function ledgerCategoryGroupKey(display: string): string {
  return display.replace(/\s+/g, '')
}

/** 合并同名时保留更易读的一条（通常更长，如含空格）。 */
export function pickRicherCategoryLabel(current: string, incoming: string): string {
  if (incoming.length > current.length) return incoming
  return current
}
