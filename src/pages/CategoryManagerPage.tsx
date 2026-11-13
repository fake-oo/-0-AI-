import { useState } from 'react'
import type { TransactionType } from '../types/transaction'
import type { Category } from '../types/category'
import SubPageHeader from '../components/SubPageHeader'
import { useCategories } from '../hooks/useCategories'
import { useTransactions } from '../hooks/useTransactions'
import { CATEGORY_ICONS } from '../constants'

/** 分类管理页：查看全部分类、新增自定义一级/二级分类、删除自定义分类（2 级，P1） */
export default function CategoryManagerPage() {
  const { categories, getSubCategories, isCustom, addCategory, deleteCategory } = useCategories()
  const { transactions } = useTransactions()

  const [addOpen, setAddOpen] = useState(false)
  const [type, setType] = useState<TransactionType>('expense')
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(CATEGORY_ICONS[0])
  const [parentId, setParentId] = useState<string>('')
  const [error, setError] = useState('')

  const parents = categories.filter((c) => !c.parentId && c.type === type)

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('请输入分类名称')
      return
    }
    if (trimmed.length > 8) {
      setError('分类名称最多 8 个字')
      return
    }
    const parent = parentId ? categories.find((c) => c.id === parentId) : undefined
    if (parent && parent.type !== type) {
      setError('二级分类的方向需与一级分类一致')
      return
    }
    addCategory({ name: trimmed, type, icon, parentId: parentId || undefined })
    setAddOpen(false)
    setName('')
    setParentId('')
    setError('')
  }

  /** 删除校验：默认分类不可删；有账单引用或挂二级分类的一级分类不可删 */
  const handleDelete = (cat: Category) => {
    if (!isCustom(cat.id)) return
    const hasChildren = categories.some((c) => c.parentId === cat.id)
    if (hasChildren) {
      window.alert('该分类下还有二级分类，请先删除或清空二级分类。')
      return
    }
    const used = transactions.filter(
      (t) => t.categoryId === cat.id || t.subCategoryId === cat.id,
    ).length
    if (used > 0) {
      window.alert(`已有 ${used} 笔账单使用该分类，不能删除。`)
      return
    }
    if (window.confirm(`确定删除「${cat.name}」吗？`)) {
      deleteCategory(cat.id)
    }
  }

  return (
    <div>
      <SubPageHeader title="分类管理" />

      {(['expense', 'income'] as const).map((t) => (
        <section key={t} className="mb-4">
          <div className="mb-2 px-1 text-xs text-gray-500">{t === 'expense' ? '支出' : '收入'}</div>
          <div className="card overflow-hidden">
            {categories
              .filter((c) => !c.parentId && c.type === t)
              .map((parent) => (
                <div key={parent.id} className="border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">{parent.icon}</span>
                    <span className="flex-1 text-sm font-medium">{parent.name}</span>
                    {isCustom(parent.id) && (
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() => handleDelete(parent)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                  {getSubCategories(parent.id).length > 0 && (
                    <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50 px-4 py-2">
                      {getSubCategories(parent.id).map((sub) => (
                        <span
                          key={sub.id}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                        >
                          {sub.name}
                          {isCustom(sub.id) && (
                            <button
                              type="button"
                              className="ml-1 text-red-600"
                              onClick={() => handleDelete(sub)}
                              aria-label={`删除 ${sub.name}`}
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}

      {/* 新增分类按钮 */}
      {!addOpen ? (
        <button
          type="button"
          className="w-full rounded-2xl border-2 border-dashed border-red-200 py-3 text-sm font-medium text-red-600 active:scale-[0.99]"
          onClick={() => setAddOpen(true)}
        >
          + 添加自定义分类
        </button>
      ) : (
        <section className="card p-4">
          <div className="mb-3 flex justify-between">
            <span className="text-sm font-bold">新增分类</span>
            <button
              type="button"
              className="text-xs text-gray-500"
              onClick={() => {
                setAddOpen(false)
                setError('')
              }}
            >
              取消
            </button>
          </div>

          <div className="mb-3 flex rounded-xl bg-gray-100 p-1">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${
                  type === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
                onClick={() => {
                  setType(t)
                  setParentId('')
                }}
              >
                {t === 'expense' ? '支出' : '收入'}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="分类名称（最多 8 个字）"
            value={name}
            maxLength={8}
            onChange={(e) => {
              setError('')
              setName(e.target.value)
            }}
            className="mb-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
          />

          <div className="mb-3">
            <div className="mb-2 text-xs text-gray-500">图标</div>
            <div className="grid max-h-32 grid-cols-10 gap-1 overflow-y-auto">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={`flex items-center justify-center rounded-lg py-1 text-lg ${
                    icon === ic ? 'bg-red-100' : ''
                  }`}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-2 text-xs text-gray-500">层级</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs ${
                  parentId === '' ? 'btn-fire text-white' : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => setParentId('')}
              >
                一级分类
              </button>
              {parents.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    parentId === p.id ? 'btn-fire text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => setParentId(p.id)}
                >
                  {p.icon} {p.name} 的二级
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

          <button
            type="button"
            className="btn-fire w-full rounded-xl py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
            onClick={handleAdd}
          >
            添加
          </button>
        </section>
      )}

      <p className="mt-4 text-center text-xs text-gray-600">
        默认分类不可删除，自定义分类可随时增删
      </p>
    </div>
  )
}
