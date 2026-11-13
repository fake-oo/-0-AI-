import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { loadMonthlyBudget } from '../storage'
import { exportCsv, exportJson } from '../utils/export'
import { formatAmount, sumAmounts } from '../utils/format'

/** 我的页：数据统计、预算/分类/导入入口、数据导出（CSV/JSON） */
export default function ProfilePage() {
  const { transactions } = useTransactions()
  const { categories } = useCategories()
  const [budget, setBudget] = useState<number | null>(null)

  useEffect(() => {
    setBudget(loadMonthlyBudget())
  }, [])

  const totalExpense = sumAmounts(
    transactions.filter((t) => t.type === 'expense').map((t) => t.amount),
  )
  const totalIncome = sumAmounts(
    transactions.filter((t) => t.type === 'income').map((t) => t.amount),
  )

  const handleExportCsv = () => {
    if (!exportCsv(transactions)) {
      window.alert('当前没有账单数据，暂无可导出内容')
    }
  }

  const handleExportJson = () => {
    if (!exportJson(transactions)) {
      window.alert('当前没有账单数据，暂无可导出内容')
    }
  }

  const entries = [
    {
      to: '/budget',
      label: '预算设置',
      hint: budget ? `${formatAmount(budget)}/月` : '未设置',
    },
    {
      to: '/categories',
      label: '分类管理',
      hint: `${categories.filter((c) => !c.parentId).length} 个一级分类`,
    },
    { to: '/import', label: '账单导入（支付宝/微信 CSV）', hint: '自动识别分类' },
  ]

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-lg font-bold">我的</h1>
      </header>

      {/* 数据统计 */}
      <section className="card mb-4 p-4">
        <div className="mb-3 text-xs text-gray-500">累计统计</div>
        <div className="grid grid-cols-3 text-center">
          <div>
            <div className="text-sm font-semibold">{transactions.length}</div>
            <div className="text-xs text-gray-500">总笔数</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-red-600">{formatAmount(totalIncome)}</div>
            <div className="text-xs text-gray-500">总收入</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-green-600">{formatAmount(totalExpense)}</div>
            <div className="text-xs text-gray-500">总支出</div>
          </div>
        </div>
      </section>

      {/* 功能入口 */}
      <nav className="mb-4 card overflow-hidden">
        {entries.map((entry, i) => (
          <NavLink
            key={entry.to}
            to={entry.to}
            className={`flex items-center justify-between px-4 py-3 text-sm active:bg-gray-50 ${
              i > 0 ? 'border-t border-gray-100' : ''
            }`}
          >
            <span>{entry.label}</span>
            <span className="text-xs text-gray-500">{entry.hint} ›</span>
          </NavLink>
        ))}
      </nav>

      {/* 数据导出（红线：数据不锁定的保底能力） */}
      <nav className="card overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">数据导出</div>
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm active:bg-gray-50"
          onClick={handleExportCsv}
        >
          <span>导出 CSV（Excel 可直接打开）</span>
          <span className="text-xs text-red-600">下载</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-between border-t border-gray-100 px-4 py-3 text-sm active:bg-gray-50"
          onClick={handleExportJson}
        >
          <span>导出 JSON（完整备份）</span>
          <span className="text-xs text-red-600">下载</span>
        </button>
      </nav>

      <p className="mt-4 text-center text-xs text-gray-600">
        数据保存在本机浏览器中 · 随时可导出带走
      </p>
    </div>
  )
}
