import { useMemo, useState } from 'react'
import type { Transaction } from '../types/transaction'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { getAccountById } from '../constants'
import { formatAmount, formatDateLabel, weekdayLabel, sumAmounts } from '../utils/format'
import {
  currentMonth,
  isCurrentMonth,
  monthKey,
  monthLabel,
  nextMonth,
  prevMonth,
} from '../utils/month'
import TransactionForm from '../components/TransactionForm'

/** 明细页（默认首页）：月份切换 + 本月收支结余 + 按日分组账单列表 + 记一笔 */
export default function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { getCategoryById } = useCategories()
  const [month, setMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const key = monthKey(month)

  const monthTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(key)),
    [transactions, key],
  )

  // 本月收入 / 支出 / 结余
  const income = sumAmounts(monthTx.filter((t) => t.type === 'income').map((t) => t.amount))
  const expense = sumAmounts(monthTx.filter((t) => t.type === 'expense').map((t) => t.amount))

  // 按日分组（日期倒序；同一天内按记账时间倒序）
  const groups = useMemo(() => {
    const byDate = new Map<string, Transaction[]>()
    for (const t of monthTx) {
      const list = byDate.get(t.date) ?? []
      list.push(t)
      byDate.set(t.date, list)
    }
    return Array.from(byDate.entries())
      .sort((a, b) => (a[0] > b[0] ? -1 : 1))
      .map(([date, list]) => ({
        date,
        items: list.sort((a, b) => b.createdAt - a.createdAt),
        dayExpense: sumAmounts(list.filter((t) => t.type === 'expense').map((t) => t.amount)),
      }))
  }, [monthTx])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (t: Transaction) => {
    setEditing(t)
    setFormOpen(true)
  }

  const handleSubmit = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editing) {
      updateTransaction({ ...editing, ...data, updatedAt: Date.now() })
    } else {
      addTransaction({
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      })
    }
    setFormOpen(false)
  }

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-lg font-bold">明细</h1>
      </header>

      {/* 月份切换 */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
          onClick={() => setMonth(prevMonth(month))}
          aria-label="上个月"
        >
          ‹
        </button>
        <span className="w-24 text-center text-sm font-medium">{monthLabel(month)}</span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 disabled:opacity-30"
          onClick={() => setMonth(nextMonth(month))}
          disabled={isCurrentMonth(month)}
          aria-label="下个月"
        >
          ›
        </button>
      </div>

      {/* 本月收入 / 支出 / 结余 */}
      <section className="card mb-4 grid grid-cols-3 p-4 text-center">
        <div>
          <div className="text-xs text-gray-500">收入</div>
          <div className="text-sm font-semibold text-red-600">{formatAmount(income)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">支出</div>
          <div className="text-sm font-semibold text-green-600">{formatAmount(expense)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">结余</div>
          <div className="text-sm font-semibold">{formatAmount(income - expense)}</div>
        </div>
      </section>

      {/* 按日分组的账单列表 */}
      <section className="space-y-3">
        {groups.length === 0 ? (
          <div className="card p-8 text-center text-sm text-gray-500">
            {monthLabel(month)}还没有账单，点右下角「+」记一笔吧
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
                <span>
                  {formatDateLabel(group.date)} {weekdayLabel(group.date)}
                </span>
                <span>
                  支出 <span className="text-green-600">{formatAmount(group.dayExpense)}</span>
                </span>
              </div>
              <ul>
                {group.items.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50"
                      onClick={() => openEdit(t)}
                    >
                      <span className="text-xl">{getCategoryById(t.categoryId)?.icon ?? '📦'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">
                          {getCategoryById(t.subCategoryId ?? '')?.name ??
                            getCategoryById(t.categoryId)?.name ??
                            '未分类'}
                        </div>
                        <div className="truncate text-xs text-gray-500">
                          {getAccountById(t.accountId)?.name ?? t.accountId}
                          {t.note ? ` · ${t.note}` : ''}
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          t.type === 'income' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatAmount(t.amount)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {/* 底部悬浮「记一笔」按钮：拇指易触达 */}
      <button
        type="button"
        className="btn-fire fixed bottom-16 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full text-2xl text-white active:scale-95"
        aria-label="记一笔"
        onClick={openAdd}
      >
        +
      </button>

      {/* 记一笔 / 编辑弹层 */}
      <TransactionForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        onDelete={(id) => {
          deleteTransaction(id)
          setFormOpen(false)
        }}
      />
    </div>
  )
}
