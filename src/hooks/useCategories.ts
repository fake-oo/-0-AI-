import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Category } from '../types/category'
import type { TransactionType } from '../types/transaction'
import { loadCustomCategories, saveCustomCategories } from '../storage'
import {
  buildCategoryList,
  findCategory,
  subCategoriesOf,
  parentCategoriesOf,
} from '../utils/categories'

/** 新建分类的入参 */
export interface NewCategoryInput {
  name: string
  type: TransactionType
  icon: string
  /** 传了 = 二级分类 */
  parentId?: string
}

/**
 * 分类数据 Hook：默认分类 + 自定义分类合并，提供增删。
 * 自定义分类持久化在 storage（customCategories），id 前缀 custom-。
 */
export function useCategories() {
  const [custom, setCustom] = useState<Category[]>([])

  useEffect(() => {
    setCustom(loadCustomCategories())
  }, [])

  const categories = useMemo(() => buildCategoryList(custom), [custom])

  const getCategoryById = useCallback((id: string) => findCategory(categories, id), [categories])
  const getSubCategories = useCallback(
    (parentId: string) => subCategoriesOf(categories, parentId),
    [categories],
  )
  const getCategoriesByType = useCallback(
    (type: TransactionType) => parentCategoriesOf(categories, type),
    [categories],
  )
  const isCustom = useCallback((id: string) => id.startsWith('custom-'), [])

  const addCategory = useCallback((input: NewCategoryInput): boolean => {
    const category: Category = {
      ...input,
      parentId: input.parentId || undefined,
      id: `custom-${crypto.randomUUID()}`,
    }
    setCustom((prev) => {
      const next = [...prev, category]
      saveCustomCategories(next)
      return next
    })
    return true
  }, [])

  const deleteCategory = useCallback((id: string): boolean => {
    let ok = false
    setCustom((prev) => {
      const next = prev.filter((c) => c.id !== id)
      ok = saveCustomCategories(next)
      return next
    })
    return ok
  }, [])

  return {
    categories,
    custom,
    getCategoryById,
    getSubCategories,
    getCategoriesByType,
    isCustom,
    addCategory,
    deleteCategory,
  }
}
