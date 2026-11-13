import { useMemo, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { formatAmount, sumAmounts } from '../utils/format'
import {
  currentMonth,
  isCurrentMonth,
  monthKey,
  monthLabel,
  nextMonth,
  prevMonth,
} from '../utils/month'

/** 环形图配色（与分类顺序对应，超出取余） */
const PALETTE = [
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
]

interface CategorySlice {
  categoryId: string
  name: string
  icon: string
  amount: number
  percent: number
  color: string
}

/** SVG 环形图（零依赖） */
function DonutChart({ slices, total }: { slices: CategorySlice[]; total: number }) {
  const R = 60
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40">
      <g transform="rotate(-90 80 80)">
        <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(17,24,39,0.06)" strokeWidth="22" />
        {slices.map((s) => {
          const len = (s.percent / 100) * C
          const el = (
            <circle
              key={s.categoryId}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return el
        })}
      </g>
      <text x="80" y="74" textAnchor="middle" className="fill-gray-500 text-[10px]">
        本月支出
      </text>
      <text x="80" y="92" textAnchor="middle" className="fill-gray-900 text-[14px] font-bold">
        {formatAmount(total)}
      </text>
    </svg>
  )
}

interface Bar {
  label: string
  amount: number
}

/** 柱状趋势图（零依赖，div 实现）：labels + 金额 */
function BarTrend({ bars, unit }: { bars: Bar[]; unit: string }) {
  const max = Math.max(...bars.map((b) => b.amount), 1)
  return (
    <div>
      <div className="flex h-32 items-end gap-px">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div
              className="w-full rounded-t bg-green-500"
              style={{ height: `${Math.max((b.amount / max) * 100, b.amount > 0 ? 4 : 1)}%` }}
              title={`${b.label}${unit}：${formatAmount(b.amount)}`}
            />
            <span className="h-3 truncate text-[8px] leading-3 text-gray-500">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type ViewMode = 'month' | 'year'

/** 图表页：月/年切换 → 支出趋势 → 分类占比 → 支出排行 */
export default function ChartsPage() {
  const { transactions } = useTransactions()
  const { getCategoryById } = useCategories()
  const [view, setView] = useState<ViewMode>('month')
  const [month, setMonth] = useState(currentMonth)

  const key = monthKey(month)

  const monthTx = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && t.date.startsWith(key)),
    [transactions, key],
  )

  const yearTx = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && t.date.startsWith(`${month.year}-`)),
    [transactions, month.year],
  )

  /** 月视图：每日支出柱状 */
  const dailyBars = useMemo(() => {
    const daysInMonth = new Date(month.year, month.month, 0).getDate()
    const byDay = new Array<number>(daysInMonth).fill(0)
    for (const t of monthTx) {
      const day = Number(t.date.split('-')[2])
      if (day >= 1 && day <= daysInMonth) byDay[day - 1] += t.amount
    }
    return byDay.map((amount, i) => ({ label: String(i + 1), amount: sumAmounts([amount]) }))
  }, [monthTx, month])

  /** 年视图：每月支出柱状 */
  const monthlyBars = useMemo(() => {
    const byMonth = new Array<number>(12).fill(0)
    for (const t of yearTx) {
      const m = Number(t.date.split('-')[1])
      if (m >= 1 && m <= 12) byMonth[m - 1] += t.amount
    }
    return byMonth.map((amount, i) => ({ label: `${i + 1}月`, amount: sumAmounts([amount]) }))
  }, [yearTx])

  /** 月视图：分类占比 + 排行 */
  const { slices, total } = useMemo(() => {
    const sum = sumAmounts(monthTx.map((t) => t.amount))
    const byCategory = new Map<string, number>()
    for (const t of monthTx) {
      byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amount)
    }
    const sorted = Array.from(byCategory.entries())
      .map(([categoryId, amount]) => ({ categoryId, amount: sumAmounts([amount]) }))
      .sort((a, b) => b.amount - a.amount)
      .map((item, i) => {
        const cat = getCategoryById(item.categoryId)
        return {
          categoryId: item.categoryId,
          name: cat?.name ?? item.categoryId,
          icon: cat?.icon ?? '📦',
          amount: item.amount,
          percent: sum > 0 ? Math.round((item.amount / sum) * 1000) / 10 : 0,
          color: PALETTE[i % PALETTE.length],
        }
      })
    return { slices: sorted, total: sum }
  }, [monthTx, getCategoryById])

  const yearTotal = sumAmounts(yearTx.map((t) => t.amount))

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-lg font-bold">图表</h1>
      </header>

      {/* 月 / 年切换 */}
      <div className="mb-4 flex justify-center">
        <div className="flex rounded-xl bg-gray-100 p-1">
          {(['month', 'year'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
                view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
              onClick={() => setView(v)}
            >
              {v === 'month' ? '月' : '年'}
            </button>
          ))}
        </div>
      </div>

      {/* 月份/年份切换 */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 shadow-sm"
          onClick={() => setMonth(prevMonth(month))}
          aria-label="上一月"
        >
          ‹
        </button>
        <span className="w-24 text-center text-sm font-medium">
          {view === 'month' ? monthLabel(month) : `${month.year}年`}
        </span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 disabled:opacity-30"
          onClick={() => setMonth(nextMonth(month))}
          disabled={isCurrentMonth(month)}
          aria-label="下一月"
        >
          ›
        </button>
      </div>

      {/* 支出趋势 */}
      <section className="card mb-4 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-xs text-gray-500">
            支出趋势（{view === 'month' ? '按日' : '按月'}）
          </span>
          <span className="text-sm font-semibold text-green-600">
            {formatAmount(view === 'month' ? total : yearTotal)}
          </span>
        </div>
        <BarTrend bars={view === 'month' ? dailyBars : monthlyBars} unit="支出" />
      </section>

      {view === 'month' && (
        <>
          {slices.length === 0 ? (
            <div className="card p-8 text-center text-sm text-gray-500">
              {monthLabel(month)}没有支出数据
            </div>
          ) : (
            <>
              {/* 环形图 */}
              <section className="card mb-4 flex justify-center p-4">
                <DonutChart slices={slices} total={total} />
              </section>

              {/* 支出排行榜 */}
              <section className="card overflow-hidden">
                <div className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
                  支出排行榜
                </div>
                <ul>
                  {slices.map((s, i) => (
                    <li key={s.categoryId} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-4 text-xs text-gray-500">{i + 1}</span>
                      <span className="text-xl">{s.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-medium">{s.name}</span>
                          <span className="text-sm font-semibold text-green-600">
                            {formatAmount(s.amount)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${s.percent}%`, backgroundColor: s.color }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-xs text-gray-500">{s.percent}%</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}

      {view === 'year' && yearTotal === 0 && (
        <div className="card p-8 text-center text-sm text-gray-500">
          {month.year}年没有支出数据
        </div>
      )}
    </div>
  )
}
