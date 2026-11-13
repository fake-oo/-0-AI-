export interface Account {
  id: string
  name: string
  icon: string
}

/** 默认账户（P1 阶段开放管理） */
export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'cash', name: '现金', icon: '💵' },
  { id: 'alipay', name: '支付宝', icon: '🅰️' },
  { id: 'wechat', name: '微信', icon: '💬' },
  { id: 'bank', name: '银行卡', icon: '🏦' },
]

export function getAccountById(id: string): Account | undefined {
  return DEFAULT_ACCOUNTS.find((a) => a.id === id)
}
