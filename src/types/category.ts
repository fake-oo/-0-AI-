import type { TransactionType } from './transaction'

/** 分类（一级或二级：二级带 parentId，挂在某个一级分类下） */
export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
  /** 二级分类所属的一级分类 id；一级分类无此字段 */
  parentId?: string
}
