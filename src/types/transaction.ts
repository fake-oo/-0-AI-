export type TransactionType = 'income' | 'expense'

/** 一笔账单 */
export interface Transaction {
  id: string
  /** 收入 / 支出 */
  type: TransactionType
  /** 金额（元，保留 2 位小数） */
  amount: number
  /** 一级分类 id，见 constants/categories */
  categoryId: string
  /** 二级分类 id（可选，P1 阶段开放自定义） */
  subCategoryId?: string
  /** 账户 id，见 constants/accounts */
  accountId: string
  /** 备注 */
  note?: string
  /** 记账日期 YYYY-MM-DD（默认今天） */
  date: string
  /** 创建时间戳（毫秒） */
  createdAt: number
  /** 最后编辑时间戳（毫秒），仅编辑过才有 */
  updatedAt?: number
  /** 外部来源单号（支付宝/微信 CSV 导入的账单才有，用于去重） */
  sourceId?: string
}
