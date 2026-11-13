import { useEffect, useState } from 'react'
import type { Transaction, TransactionType } from '../types/transaction'
import { DEFAULT_ACCOUNTS } from '../constants'
import { useCategories } from '../hooks/useCategories'
import { today } from '../utils/format'

export interface TransactionFormData {
  type: TransactionType
  amount: number
  categoryId: string
  subCategoryId?: string
  accountId: string
  note?: string
  date: string
}

interface TransactionFormProps {
  open: boolean
  /** 传入已有账单 = 编辑模式；null = 新增 */
  initial?: Transaction | null
  onClose: () => void
  onSubmit: (data: TransactionFormData) => void
  /** 编辑模式下可删除 */
  onDelete?: (id: string) => void
}

/** 金额输入清洗：只留数字、最多一个小数点、最多两位小数 */
function sanitizeAmount(value: string): string {
  let v = value.replace(/[^\d.]/g, '')
  const firstDot = v.indexOf('.')
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '')
  }
  const [int, dec] = v.split('.')
  if (dec !== undefined) return `${int}.${dec.slice(0, 2)}`
  return v
}

/**
 * 记一笔 / 编辑账单底部弹层。
 * P0 目标：记一笔 ≤ 10 秒 —— 默认值兜底（今天/支出/餐饮/现金），最少只需填金额点保存。
 */
export default function TransactionForm({
  open,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: TransactionFormProps) {
  const isEdit = Boolean(initial)

  const { getCategoriesByType, getCategoryById, getSubCategories } = useCategories()

  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('food')
  const [subCategoryId, setSubCategoryId] = useState<string | undefined>(undefined)
  const [accountId, setAccountId] = useState('cash')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today())
  const [error, setError] = useState('')

  // 每次打开时按 initial 重置（新增用默认值，编辑回填原值）
  useEffect(() => {
    if (!open) return
    if (initial) {
      setType(initial.type)
      setAmount(String(initial.amount))
      setCategoryId(initial.categoryId)
      setSubCategoryId(initial.subCategoryId)
      setAccountId(initial.accountId)
      setNote(initial.note ?? '')
      setDate(initial.date)
    } else {
      setType('expense')
      setAmount('')
      setCategoryId('food')
      setSubCategoryId(undefined)
      setAccountId('cash')
      setNote('')
      setDate(today())
    }
    setError('')
  }, [open, initial])

  if (!open) return null

  const categories = getCategoriesByType(type)
  const subCategories = getSubCategories(categoryId)

  const switchType = (next: TransactionType) => {
    if (next === type) return
    setType(next)
    // 换收支方向后，当前分类不属于该方向就重置
    if (getCategoryById(categoryId)?.type !== next) {
      const first = getCategoriesByType(next)[0]
      setCategoryId(first?.id ?? '')
      setSubCategoryId(undefined)
    }
  }

  const handleSubmit = () => {
    const trimmed = amount.trim()
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      setError('请输入正确金额（大于 0，最多两位小数）')
      return
    }
    const num = Number(trimmed)
    if (num <= 0) {
      setError('金额必须大于 0')
      return
    }
    if (num > 99999999) {
      setError('金额过大，请检查输入')
      return
    }
    if (!categoryId) {
      setError('请选择分类')
      return
    }
    if (!date) {
      setError('请选择日期')
      return
    }
    onSubmit({
      type,
      amount: num,
      categoryId,
      subCategoryId: subCategoryId || undefined,
      accountId,
      note: note.trim() || undefined,
      date,
    })
  }

  const handleDelete = () => {
    if (!initial) return
    if (window.confirm('确定删除这笔账单吗？删除后不可恢复。')) {
      onDelete?.(initial.id)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      {/* 遮罩 */}
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* 弹层面板 */}
      <div className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl bg-white pb-6 shadow-2xl">
        {/* 标题 + 关闭 */}
        <div className="sticky top-0 flex items-center justify-between bg-white px-4 pt-4 pb-2">
          <h2 className="text-base font-bold">{isEdit ? '编辑账单' : '记一笔'}</h2>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
            onClick={onClose}
            aria-label="关闭弹层"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-4">
          {/* 收支切换 */}
          <div className="flex rounded-xl bg-gray-100 p-1">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  type === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
                onClick={() => switchType(t)}
              >
                {t === 'expense' ? '支出' : '收入'}
              </button>
            ))}
          </div>

          {/* 金额 */}
          <div className="flex items-baseline gap-1 border-b border-gray-200 py-2">
            <span className="text-xl font-bold text-gray-700">¥</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setError('')
                setAmount(sanitizeAmount(e.target.value))
              }}
              className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-gray-600"
              autoFocus={!isEdit}
            />
          </div>

          {/* 一级分类 */}
          <section>
            <div className="mb-2 text-xs text-gray-500">分类</div>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(c.id)
                    setSubCategoryId(undefined)
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs transition-colors ${
                    categoryId === c.id
                      ? 'bg-red-50 font-medium text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </section>

          {/* 二级分类（有子分类的一级才显示） */}
          {subCategories.length > 0 && (
            <section>
              <div className="mb-2 text-xs text-gray-500">子分类（可不选）</div>
              <div className="flex flex-wrap gap-2">
                {subCategories.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSubCategoryId(subCategoryId === s.id ? undefined : s.id)}
                    className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                      subCategoryId === s.id
                        ? 'btn-fire text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 账户 */}
          <section>
            <div className="mb-2 text-xs text-gray-500">账户</div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ACCOUNTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccountId(a.id)}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    accountId === a.id ? 'btn-fire text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {a.icon} {a.name}
                </button>
              ))}
            </div>
          </section>

          {/* 日期 + 备注 */}
          <div className="flex gap-3">
            <input
              type="date"
              value={date}
              max="9999-12-31"
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
            <input
              type="text"
              placeholder="备注（可不填）"
              value={note}
              maxLength={50}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 active:scale-[0.98]"
                style={{ flex: '0 0 96px' }}
              >
                删除
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-fire flex-1 rounded-xl py-3 text-sm font-semibold text-white active:scale-[0.98]"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
