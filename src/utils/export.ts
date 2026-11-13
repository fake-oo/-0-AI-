import type { Transaction } from '../types/transaction'
import { getAccountById } from '../constants'
import { buildCategoryListFromStorage, findCategory } from './categories'

/**
 * 数据导出：CSV（带 BOM，Excel 打开中文不乱码）+ JSON（备份恢复用）。
 * 红线要求：任何版本都必须能完整导出全部数据，不锁定。
 */

/** CSV 单元格转义：含逗号/引号/换行的值用双引号包裹，内部引号翻倍 */
function escapeCsvCell(value: string): string {
  const cleaned = value.replace(/\r?\n/g, ' ')
  if (/[",]/.test(cleaned)) {
    return `"${cleaned.replace(/"/g, '""')}"`
  }
  return cleaned
}

function buildCsv(transactions: Transaction[]): string {
  const categories = buildCategoryListFromStorage()
  const header = ['日期', '类型', '一级分类', '二级分类', '账户', '金额', '备注']
  const rows = transactions
    .slice()
    .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1))
    .map((t) => {
      const category = findCategory(categories, t.categoryId)
      const sub = t.subCategoryId ? findCategory(categories, t.subCategoryId) : undefined
      const account = getAccountById(t.accountId)
      return [
        t.date,
        t.type === 'income' ? '收入' : '支出',
        category?.name ?? t.categoryId,
        sub?.name ?? '',
        account?.name ?? t.accountId,
        t.amount.toFixed(2),
        escapeCsvCell(t.note ?? ''),
      ]
        .map(escapeCsvCell)
        .join(',')
    })
  // \uFEFF = UTF-8 BOM，Excel 识别用
  return `\uFEFF${[header.join(','), ...rows].join('\r\n')}`
}

function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function timestamp(): string {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
}

/** 导出全部账单为 CSV（Excel 友好） */
export function exportCsv(transactions: Transaction[]): boolean {
  if (transactions.length === 0) return false
  download(buildCsv(transactions), `记账本-${timestamp()}.csv`, 'text/csv;charset=utf-8')
  return true
}

/** 导出全部账单为 JSON（备份/恢复用，字段与本地存储一致） */
export function exportJson(transactions: Transaction[]): boolean {
  if (transactions.length === 0) return false
  const data = {
    app: 'expense-app',
    version: 2,
    exportedAt: new Date().toISOString(),
    transactions,
  }
  download(JSON.stringify(data, null, 2), `记账本-${timestamp()}.json`, 'application/json')
  return true
}
