import { useState } from 'react'
import SubPageHeader from '../components/SubPageHeader'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { parseBillCsv, toTransactions } from '../utils/import'
import type { ParsedBill } from '../utils/import'
import { formatAmount, sumAmounts } from '../utils/format'

/**
 * 账单导入页：上传支付宝/微信导出的账单 CSV，自动识别格式和分类，预览后导入（去重）。
 * 替代「自动连接支付渠道」的方案（两家均无对个人开放的 API）。
 */
export default function ImportPage() {
  const { addTransactions } = useTransactions()
  const { getCategoryById } = useCategories()

  const [parsed, setParsed] = useState<ParsedBill | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ added: number; duplicated: number } | null>(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (file: File) => {
    setBusy(true)
    setError('')
    setParsed(null)
    setResult(null)
    try {
      const bill = await parseBillCsv(file)
      if (bill.rows.length === 0) {
        setError('文件里没有识别到有效账单（收支明细）。请确认导出的是账单明细 CSV。')
      } else {
        setParsed(bill)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '文件解析失败')
    } finally {
      setBusy(false)
    }
  }

  const handleImport = () => {
    if (!parsed) return
    const transactions = toTransactions(parsed)
    const added = addTransactions(transactions)
    setResult({ added, duplicated: transactions.length - added })
    setParsed(null)
  }

  const previewRows = parsed ? parsed.rows.slice(0, 5) : []
  const previewExpense = sumAmounts(
    parsed?.rows.filter((r) => r.type === 'expense').map((r) => r.amount) ?? [],
  )
  const previewIncome = sumAmounts(
    parsed?.rows.filter((r) => r.type === 'income').map((r) => r.amount) ?? [],
  )

  return (
    <div>
      <SubPageHeader title="账单导入" />

      <section className="card mb-4 p-4 text-xs leading-relaxed text-gray-500">
        <p className="mb-1 font-medium text-gray-700">怎么导出账单？</p>
        <p>支付宝：我的 → 账单 → 右上角「…」→ 开具交易流水证明（或账单导出）</p>
        <p>微信：我 → 服务 → 钱包 → 账单 → 右上角常见问题 → 下载账单</p>
        <p className="mt-1">
          导出的 CSV 文件直接在下方上传，自动识别格式和分类，重复导入会自动去重。
        </p>
      </section>

      {/* 文件选择 */}
      {!result && !parsed && (
        <label
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-200 bg-transparent p-8 text-center ${
            busy ? 'opacity-50' : ''
          }`}
        >
          <span className="mb-2 text-3xl">📄</span>
          <span className="text-sm font-medium text-red-600">
            {busy ? '解析中…' : '点击选择账单 CSV 文件'}
          </span>
          <span className="mt-1 text-xs text-gray-500">
            支持支付宝 / 微信导出文件（含 GBK 编码）
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
        </label>
      )}

      {error && (
        <div className="card bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {/* 预览 */}
      {parsed && (
        <section className="card p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-bold">
              {parsed.source === 'alipay' ? '支付宝账单' : '微信账单'}
            </span>
            <span className="text-xs text-gray-500">
              共 {parsed.rows.length} 笔{parsed.invalid > 0 && `（跳过无效行 ${parsed.invalid}）`}
            </span>
          </div>

          <div className="mb-3 grid grid-cols-2 text-center">
            <div className="rounded-xl bg-gray-50 py-2">
              <div className="text-xs text-gray-500">支出合计</div>
              <div className="text-sm font-semibold text-green-600">
                {formatAmount(previewExpense)}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 py-2">
              <div className="text-xs text-gray-500">收入合计</div>
              <div className="text-sm font-semibold text-red-600">
                {formatAmount(previewIncome)}
              </div>
            </div>
          </div>

          <ul className="mb-3 space-y-2">
            {previewRows.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">{r.date.slice(5)}</span>
                <span className="flex-1 truncate text-gray-600">
                  {getCategoryById(r.categoryId)?.name ?? r.categoryId}
                  {r.note ? ` · ${r.note}` : ''}
                </span>
                <span
                  className={`font-semibold ${r.type === 'income' ? 'text-red-600' : 'text-green-600'}`}
                >
                  {r.type === 'income' ? '+' : '-'}
                  {formatAmount(r.amount)}
                </span>
              </li>
            ))}
            {parsed.rows.length > 5 && (
              <li className="text-center text-xs text-gray-600">
                … 其余 {parsed.rows.length - 5} 笔略
              </li>
            )}
          </ul>

          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm text-gray-500 active:scale-[0.98]"
              onClick={() => setParsed(null)}
            >
              取消
            </button>
            <button
              type="button"
              className="btn-fire flex-1 rounded-xl py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
              onClick={handleImport}
            >
              导入 {parsed.rows.length} 笔
            </button>
          </div>
        </section>
      )}

      {/* 导入结果 */}
      {result && (
        <div className="card bg-amber-50 p-6 text-center">
          <div className="mb-1 text-2xl">✅</div>
          <p className="text-sm font-medium text-red-600">
            成功导入 {result.added} 笔账单
            {result.duplicated > 0 && `，自动去重跳过 ${result.duplicated} 笔`}
          </p>
          <button
            type="button"
            className="mt-3 text-xs text-gray-500 underline"
            onClick={() => setResult(null)}
          >
            继续导入其他文件
          </button>
        </div>
      )}
    </div>
  )
}
