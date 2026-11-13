import type { Transaction } from '../types/transaction'
import type { Category } from '../types/category'

/**
 * 数据层统一封装：所有 LocalStorage 读写只走这个模块，组件不直接碰 LocalStorage。
 *
 * 数据结构带版本号字段，结构变更时通过 migrations 做旧数据兼容。
 * v1 → v2：新增 customCategories（自定义分类）和 monthlyBudget（月度预算）。
 */

const STORAGE_KEY = 'expense-app:data'

/** 当前数据结构版本，结构变更时 +1 并在 migrations 中补迁移函数 */
const DATA_VERSION = 2

interface StorageData {
  version: number
  transactions: Transaction[]
  /** 用户自定义分类（含二级，parentId 挂在某个一级下） */
  customCategories: Category[]
  /** 月度预算（元），null = 未设置 */
  monthlyBudget: number | null
}

/** 各版本迁移函数：migrations[v] 把 v 版数据迁移到 v+1 版 */
const migrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
  1: (data) => ({ ...data, customCategories: [], monthlyBudget: null, version: 2 }),
}

function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    (t.type === 'income' || t.type === 'expense') &&
    typeof t.amount === 'number' &&
    typeof t.categoryId === 'string' &&
    typeof t.accountId === 'string' &&
    typeof t.date === 'string' &&
    typeof t.createdAt === 'number'
  )
}

function isCategory(value: unknown): value is Category {
  if (typeof value !== 'object' || value === null) return false
  const c = value as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    (c.type === 'income' || c.type === 'expense') &&
    typeof c.icon === 'string' &&
    (c.parentId === undefined || typeof c.parentId === 'string')
  )
}

function migrate(raw: unknown): StorageData {
  // 容错：数据损坏或格式不对时，返回空数据而不是崩溃
  let data = raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {}
  let version = typeof data.version === 'number' ? data.version : 0

  // 逐版本向上迁移
  while (version < DATA_VERSION) {
    const migrateFn = migrations[version]
    if (!migrateFn) break // 没有迁移路径，按空数据兜底处理
    data = migrateFn(data)
    version = typeof data.version === 'number' ? data.version : version + 1
  }

  const transactions = Array.isArray(data.transactions)
    ? (data.transactions as unknown[]).filter(isTransaction)
    : []
  const customCategories = Array.isArray(data.customCategories)
    ? (data.customCategories as unknown[]).filter(isCategory)
    : []
  const monthlyBudget =
    typeof data.monthlyBudget === 'number' && data.monthlyBudget > 0 ? data.monthlyBudget : null

  return { version: DATA_VERSION, transactions, customCategories, monthlyBudget }
}

function loadRaw(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw)
      return { version: DATA_VERSION, transactions: [], customCategories: [], monthlyBudget: null }
    return migrate(JSON.parse(raw))
  } catch {
    // JSON 损坏或 localStorage 不可用时，返回空数据
    return { version: DATA_VERSION, transactions: [], customCategories: [], monthlyBudget: null }
  }
}

/** 读-改-写：局部更新不会覆盖其他字段 */
function patchData(patch: Partial<StorageData>): boolean {
  try {
    const data = { ...loadRaw(), ...patch, version: DATA_VERSION }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function loadTransactions(): Transaction[] {
  return loadRaw().transactions
}

export function saveTransactions(transactions: Transaction[]): boolean {
  return patchData({ transactions })
}

export function loadCustomCategories(): Category[] {
  return loadRaw().customCategories
}

export function saveCustomCategories(customCategories: Category[]): boolean {
  return patchData({ customCategories })
}

export function loadMonthlyBudget(): number | null {
  return loadRaw().monthlyBudget
}

export function saveMonthlyBudget(monthlyBudget: number | null): boolean {
  return patchData({ monthlyBudget })
}
