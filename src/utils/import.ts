import type { Transaction, TransactionType } from '../types/transaction'
import { matchCategory } from './categories'

/**
 * 支付宝 / 微信账单 CSV 导入解析。
 *
 * 两家都不对个人开放消费 API，官方均支持导出账单 CSV（替代方案，见 RESEARCH.md）。
 * - 支付宝：表头含「交易订单号」，列有 交易时间/交易分类/交易对方/商品说明/收/支/金额…
 * - 微信：表头含「交易单号」，列有 交易时间/交易类型/交易对方/商品/收/支/金额(元)…
 * - 编码：优先按 UTF-8 解；出现替换字符（乱码）时按 GBK 重解（两家导出常见 GBK）。
 */

export interface ParsedRow {
  date: string
  type: TransactionType
  amount: number
  categoryId: string
  note: string
  sourceId: string
}

export interface ParsedBill {
  source: 'alipay' | 'wechat'
  rows: ParsedRow[]
  /** 解析失败/跳过的行数（不含收支列空值的行） */
  invalid: number
}

/** 拆一行 CSV（处理双引号包裹的字段） */
function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuote = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuote = true
    } else if (ch === ',') {
      cells.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur)
  return cells.map((c) => c.trim())
}

/** 读文件文本：UTF-8 优先，乱码回退 GBK（支付宝/微信导出常见 GBK 编码） */
async function readFileText(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  let text = new TextDecoder('utf-8').decode(buf)
  if (text.includes('\uFFFD')) {
    try {
      text = new TextDecoder('gbk').decode(buf)
    } catch {
      // 浏览器不支持 gk 解码器就按原样处理
    }
  }
  return text.replace(/^\uFEFF/, '')
}

function detectSource(headerLine: string): 'alipay' | 'wechat' | null {
  if (headerLine.includes('交易订单号')) return 'alipay'
  if (headerLine.includes('交易单号')) return 'wechat'
  return null
}

/** 解析金额：去 ¥、逗号，转数字 */
function parseAmount(value: string): number {
  const n = Number(value.replace(/[¥,，\s]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

function findIndex(headers: string[], ...names: string[]): number {
  for (const name of names) {
    const idx = headers.findIndex((h) => h === name)
    if (idx !== -1) return idx
  }
  // 兼容「金额(元)」这类前缀匹配
  for (const name of names) {
    const idx = headers.findIndex((h) => h.startsWith(name))
    if (idx !== -1) return idx
  }
  return -1
}

/** 解析账单 CSV 文件（自动识别支付宝/微信格式） */
export async function parseBillCsv(file: File): Promise<ParsedBill> {
  const text = await readFileText(file)
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')

  // 找表头行（含「交易时间」）
  const headerIdx = lines.findIndex((l) => l.includes('交易时间'))
  if (headerIdx === -1) {
    throw new Error(
      '未识别到账单表头（需包含「交易时间」列）。请确认导出的是支付宝/微信官方账单 CSV。',
    )
  }

  const source = detectSource(lines[headerIdx])
  if (!source) {
    throw new Error('未识别出支付宝/微信账单格式，请检查文件。')
  }

  const headers = splitCsvLine(lines[headerIdx])
  const col = {
    date: findIndex(headers, '交易时间'),
    direction: findIndex(headers, '收/支', '收/支(元)'),
    amount: findIndex(headers, '金额', '金额(元)'),
    category: findIndex(headers, source === 'alipay' ? '交易分类' : '交易类型'),
    counterparty: findIndex(headers, '交易对方'),
    note: findIndex(headers, '商品说明', '商品'),
    sourceId: findIndex(headers, source === 'alipay' ? '交易订单号' : '交易单号'),
  }

  const rows: ParsedRow[] = []
  let invalid = 0

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    // 尾部汇总行特征：以 ---- 开头或关键列缺失
    if (cells[0]?.startsWith('---')) continue

    const direction = col.direction !== -1 ? cells[col.direction] : ''
    if (direction !== '收入' && direction !== '支出') continue // 不计收支、汇总行等直接跳过

    const date = (col.date !== -1 ? cells[col.date] : '').split(' ')[0] ?? ''
    const amount = col.amount !== -1 ? parseAmount(cells[col.amount]) : NaN
    const sourceId = col.sourceId !== -1 ? cells[col.sourceId] : ''

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount) || amount <= 0) {
      invalid++
      continue
    }

    const type: TransactionType = direction === '收入' ? 'income' : 'expense'
    const categoryText = col.category !== -1 ? cells[col.category] : ''
    const counterparty = col.counterparty !== -1 ? cells[col.counterparty] : ''
    const noteRaw = col.note !== -1 ? cells[col.note] : ''

    rows.push({
      date,
      type,
      amount: Math.round(amount * 100) / 100,
      categoryId: matchCategory(categoryText, type),
      note: [counterparty, noteRaw].filter(Boolean).slice(0, 2).join(' · ').slice(0, 50),
      sourceId,
    })
  }

  return { source, rows, invalid }
}

/** 解析结果 → Transaction 列表（账户按来源自动落支付宝/微信） */
export function toTransactions(parsed: ParsedBill): Transaction[] {
  const accountId = parsed.source === 'alipay' ? 'alipay' : 'wechat'
  const now = Date.now()
  return parsed.rows.map((r, i) => ({
    id: crypto.randomUUID(),
    type: r.type,
    amount: r.amount,
    categoryId: r.categoryId,
    accountId,
    note: r.note || undefined,
    date: r.date,
    createdAt: now + i, // 保持导入顺序
    sourceId: r.sourceId || undefined,
  }))
}
