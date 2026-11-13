/** 金额格式化：¥ + 两位小数（金额不做四舍五入外的处理，负数原样显示） */
export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

/** 日期格式化：YYYY-MM-DD → 「11月9日」样式（用于按日分组标题） */
export function formatDateLabel(date: string): string {
  const [, m, d] = date.split('-')
  return `${Number(m)}月${Number(d)}日`
}

/** 获取今天的日期字符串 YYYY-MM-DD */
export function today(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

/** YYYY-MM-DD → 周几（用于按日分组标题） */
export function weekdayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return WEEKDAYS[dt.getDay()]
}

/** 浮点求和：先取整到分再累加，避免 0.1 + 0.2 精度漂移 */
export function sumAmounts(amounts: number[]): number {
  return Math.round(amounts.reduce((s, a) => s + a * 100, 0)) / 100
}
