/** 月份工具：明细页/图表页共用的月份切换逻辑 */

export interface MonthRange {
  year: number
  /** 1-12 */
  month: number
}

export function currentMonth(): MonthRange {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/** 'YYYY-MM'，用于 t.date.startsWith() 过滤 */
export function monthKey(m: MonthRange): string {
  return `${m.year}-${String(m.month).padStart(2, '0')}`
}

export function monthLabel(m: MonthRange): string {
  return `${m.year}年${m.month}月`
}

export function prevMonth(m: MonthRange): MonthRange {
  return m.month === 1 ? { year: m.year - 1, month: 12 } : { ...m, month: m.month - 1 }
}

export function nextMonth(m: MonthRange): MonthRange {
  return m.month === 12 ? { year: m.year + 1, month: 1 } : { ...m, month: m.month + 1 }
}

export function isCurrentMonth(m: MonthRange): boolean {
  const now = currentMonth()
  return now.year === m.year && now.month === m.month
}
