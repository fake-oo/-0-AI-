import type { Category } from '../types/category'

/** 默认支出一级分类 */
export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: '餐饮', type: 'expense', icon: '🍜' },
  { id: 'transport', name: '交通', type: 'expense', icon: '🚌' },
  { id: 'shopping', name: '购物', type: 'expense', icon: '🛍️' },
  { id: 'housing', name: '居家', type: 'expense', icon: '🏠' },
  { id: 'entertainment', name: '娱乐', type: 'expense', icon: '🎮' },
  { id: 'medical', name: '医疗', type: 'expense', icon: '💊' },
  { id: 'education', name: '教育', type: 'expense', icon: '📚' },
  { id: 'other-expense', name: '其他', type: 'expense', icon: '📦' },
]

/** 默认收入一级分类 */
export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: '工资', type: 'income', icon: '💰' },
  { id: 'invest', name: '理财', type: 'income', icon: '📈' },
  { id: 'redpacket', name: '红包', type: 'income', icon: '🧧' },
  { id: 'other-income', name: '其他', type: 'income', icon: '📦' },
]

/** 默认二级分类（parentId 挂在一级分类下） */
export const DEFAULT_SUB_CATEGORIES: Category[] = [
  // 餐饮
  { id: 'food-breakfast', name: '早餐', type: 'expense', icon: '🥣', parentId: 'food' },
  { id: 'food-lunch', name: '午餐', type: 'expense', icon: '🍱', parentId: 'food' },
  { id: 'food-dinner', name: '晚餐', type: 'expense', icon: '🍲', parentId: 'food' },
  { id: 'food-snack', name: '零食饮品', type: 'expense', icon: '🧋', parentId: 'food' },
  // 交通
  { id: 'transport-transit', name: '公交地铁', type: 'expense', icon: '🚇', parentId: 'transport' },
  { id: 'transport-taxi', name: '打车', type: 'expense', icon: '🚕', parentId: 'transport' },
  { id: 'transport-fuel', name: '加油', type: 'expense', icon: '⛽', parentId: 'transport' },
  // 购物
  { id: 'shopping-daily', name: '日用品', type: 'expense', icon: '🧻', parentId: 'shopping' },
  { id: 'shopping-clothes', name: '服饰', type: 'expense', icon: '👕', parentId: 'shopping' },
  { id: 'shopping-digital', name: '数码', type: 'expense', icon: '📱', parentId: 'shopping' },
  // 居家
  { id: 'housing-rent', name: '房租水电', type: 'expense', icon: '🧾', parentId: 'housing' },
  { id: 'housing-repair', name: '维修', type: 'expense', icon: '🔧', parentId: 'housing' },
  // 娱乐
  {
    id: 'entertainment-movie',
    name: '电影演出',
    type: 'expense',
    icon: '🎬',
    parentId: 'entertainment',
  },
  {
    id: 'entertainment-game',
    name: '游戏',
    type: 'expense',
    icon: '🎮',
    parentId: 'entertainment',
  },
  // 医疗
  { id: 'medical-drug', name: '药品', type: 'expense', icon: '💊', parentId: 'medical' },
  { id: 'medical-visit', name: '门诊', type: 'expense', icon: '🏥', parentId: 'medical' },
  // 教育
  { id: 'education-book', name: '书籍', type: 'expense', icon: '📖', parentId: 'education' },
  { id: 'education-course', name: '课程', type: 'expense', icon: '🎓', parentId: 'education' },
]

/** 默认分类全集（一级 + 二级，扁平存储） */
export const DEFAULT_CATEGORIES: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_SUB_CATEGORIES,
]

/** 新增分类可选的图标 */
export const CATEGORY_ICONS = [
  '🍜',
  '🥣',
  '🍱',
  '🧋',
  '🚌',
  '🚕',
  '🚇',
  '⛽',
  '🛍️',
  '👕',
  '🧻',
  '📱',
  '🏠',
  '🧾',
  '🔧',
  '🎮',
  '🎬',
  '💊',
  '🏥',
  '📚',
  '📖',
  '🎓',
  '💰',
  '📈',
  '🧧',
  '📦',
  '☕',
  '🎁',
  '✈️',
  '💇',
  '🐱',
  '🐶',
  '⚽',
  '🚗',
  '💡',
  '🏷️',
  '❤️',
  '💼',
  '🎵',
  '🛒',
]
