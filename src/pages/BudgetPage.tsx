import { useEffect, useState } from 'react'
import SubPageHeader from '../components/SubPageHeader'
import { useTransactions } from '../hooks/useTransactions'
import { loadMonthlyBudget, saveMonthlyBudget } from '../storage'
import { formatAmount, sumAmounts } from '../utils/format'
import { monthLabel, currentMonth } from '../utils/month'

/** 预算设置页：设置/修改/取消月度预算，实时看本月用量 */
export default function BudgetPage() {
  const { transactions } = useTransactions()
  const [input, setInput] = useState('')
  const [saved, setSaved] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')

  useEffect(() => {
    const budget = loadMonthlyBudget()
    setSaved(budget)
    setInput(budget ? String(budget) : '')
  }, [])

  const month = currentMonth()
  const monthExpense = sumAmounts(
    transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.date.startsWith(`${month.year}-${String(month.month).padStart(2, '0')}`),
      )
      .map((t) => t.amount),
  )

  const handleSave = () => {
    const trimmed = input.trim()
    if (trimmed === '') {
      setError('请输入预算金额')
      return
    }
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed) || Number(trimmed) <= 0) {
      setError('预算需为大于 0 的金额（最多两位小数）')
      return
    }
    const value = Math.round(Number(trimmed) * 100) / 100
    if (saveMonthlyBudget(value)) {
      setSaved(value)
      setError('')
      setFlash('已保存')
      setTimeout(() => setFlash(''), 1500)
    } else {
      setError('保存失败，请重试')
    }
  }

  const handleClear = () => {
    if (saved === null) return
    if (window.confirm('确定取消月度预算吗？取消后不再提示超支预警。')) {
      saveMonthlyBudget(null)
      setSaved(null)
      setInput('')
    }
  }

  const usage = saved && saved > 0 ? Math.min(Math.round((monthExpense / saved) * 100), 999) : 0

  return (
    <div>
      <SubPageHeader title="预算设置" />

      {saved && saved > 0 && (
        <section className="card mb-4 p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs text-gray-500">{monthLabel(month)}已用</span>
            <span
              className={`text-sm font-semibold ${usage >= 100 ? 'text-red-600' : usage >= 80 ? 'text-red-600' : 'text-green-600'}`}
            >
              {formatAmount(monthExpense)} / {formatAmount(saved)}（{usage}%）
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${usage >= 100 ? 'bg-red-500' : usage >= 80 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(usage, 100)}%` }}
            />
          </div>
        </section>
      )}

      <section className="card p-4">
        <div className="mb-2 text-xs text-gray-500">每月支出预算（元）</div>
        <div className="flex gap-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="如 3000"
            value={input}
            onChange={(e) => {
              setError('')
              let v = e.target.value.replace(/[^\d.]/g, '')
              const firstDot = v.indexOf('.')
              if (firstDot !== -1) {
                v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '')
              }
              const [int, dec] = v.split('.')
              if (dec !== undefined) v = `${int}.${dec.slice(0, 2)}`
              setInput(v)
            }}
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
          <button
            type="button"
            className="btn-fire rounded-xl px-6 text-sm font-semibold text-white active:scale-[0.98]"
            onClick={handleSave}
          >
            {flash || '保存'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <p className="mt-3 text-xs text-gray-500">超支 80% 提醒、超支后进入应用时横幅预警</p>
        {saved !== null && (
          <button
            type="button"
            className="mt-3 text-xs text-gray-500 underline"
            onClick={handleClear}
          >
            取消预算
          </button>
        )}
      </section>
    </div>
  )
}
