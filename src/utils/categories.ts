import type { Category } from '../types/category'
import type { TransactionType } from '../types/transaction'
import { DEFAULT_CATEGORIES } from '../constants/categories'
import { loadCustomCategories } from '../storage'

/** 合并默认分类 + 自定义分类，得到当前生效的完整分类列表 */
export function buildCategoryList(custom: Category[]): Category[] {
  return [...DEFAULT_CATEGORIES, ...custom]
}

/** 从 storage 直接构建（非 React 场景用：CSV 导出等） */
export function buildCategoryListFromStorage(): Category[] {
  return buildCategoryList(loadCustomCategories())
}

export function findCategory(list: Category[], id: string): Category | undefined {
  return list.find((c) => c.id === id)
}

/** 某个一级分类下的二级分类 */
export function subCategoriesOf(list: Category[], parentId: string): Category[] {
  return list.filter((c) => c.parentId === parentId)
}

/** 一级分类（按收支方向） */
export function parentCategoriesOf(list: Category[], type: TransactionType): Category[] {
  return list.filter((c) => c.type === type && !c.parentId)
}

/**
 * 账单导入时的分类自动匹配：支付宝「交易分类」/ 微信「交易类型」关键词 → 应用内分类 id。
 * 未命中返回 'other-expense' / 'other-income'。
 */
const CATEGORY_KEYWORDS: Array<{ keywords: string[]; id: string }> = [
  // 支出
  { keywords: ['餐饮', '美食', '外卖', '快食'], id: 'food' },
  { keywords: ['交通', '出行', '打车', '地铁', '公交', '航空', '火车', '用车'], id: 'transport' },
  { keywords: ['服饰', '美妆', '日用', '百货', '购物', '数码', '电器'], id: 'shopping' },
  { keywords: ['住宅', '家居', '房租', '水电', '物业', '装修', '生活服务'], id: 'housing' },
  { keywords: ['娱乐', '电影', '演出', '游戏', '运动', '健身', '休闲'], id: 'entertainment' },
  { keywords: ['医疗', '药品', '健康', '保健'], id: 'medical' },
  { keywords: ['教育', '文化', '书籍', '培训', '知识'], id: 'education' },
  // 收入
  { keywords: ['工资', '薪酬', '奖金', '公积金'], id: 'salary' },
  { keywords: ['理财', '基金', '利息', '分红', '余额宝', '股票', '投资'], id: 'invest' },
  { keywords: ['红包', '转账', '亲友', '收款'], id: 'redpacket' },
]

export function matchCategory(text: string, type: TransactionType): string {
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((k) => text.includes(k))) {
      return entry.id
    }
  }
  return type === 'expense' ? 'other-expense' : 'other-income'
}
