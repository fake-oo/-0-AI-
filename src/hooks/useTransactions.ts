import { useCallback, useEffect, useState } from 'react'
import type { Transaction } from '../types/transaction'
import { loadTransactions, saveTransactions } from '../storage'

/**
 * 账单数据 Hook：组件层统一通过它读写账单（不直接碰 LocalStorage）。
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    setTransactions(loadTransactions())
  }, [])

  /** 统一持久化：更新内存态 + 写 LocalStorage（失败不崩页，走控制台告警） */
  const mutate = useCallback((updater: (prev: Transaction[]) => Transaction[]) => {
    setTransactions((prev) => {
      const next = updater(prev)
      if (!saveTransactions(next)) {
        console.error('账单保存失败：localStorage 写入异常')
      }
      return next
    })
  }, [])

  const addTransaction = useCallback(
    (t: Transaction) => {
      mutate((prev) => [...prev, t])
    },
    [mutate],
  )

  /** 批量导入（支付宝/微信 CSV），按 sourceId 去重，返回实际新增的条数 */
  const addTransactions = useCallback(
    (list: Transaction[]): number => {
      let added = 0
      mutate((prev) => {
        const sourceIds = new Set(prev.map((t) => t.sourceId).filter(Boolean))
        const fresh = list.filter((t) => !t.sourceId || !sourceIds.has(t.sourceId))
        added = fresh.length
        return [...prev, ...fresh]
      })
      return added
    },
    [mutate],
  )

  const updateTransaction = useCallback(
    (t: Transaction) => {
      mutate((prev) => prev.map((item) => (item.id === t.id ? t : item)))
    },
    [mutate],
  )

  const deleteTransaction = useCallback(
    (id: string) => {
      mutate((prev) => prev.filter((t) => t.id !== id))
    },
    [mutate],
  )

  return { transactions, addTransaction, addTransactions, updateTransaction, deleteTransaction }
}
