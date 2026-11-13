import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'
import { loadMonthlyBudget, loadTransactions } from '../storage'
import { formatAmount, sumAmounts } from '../utils/format'
import { monthKey, currentMonth } from '../utils/month'

/**
 * 火焰线稿纹样：纤细红色线条组成的火焰形态，仅作底层氛围。
 * - stroke 1.2px，无填充；透明度 0.06–0.14，不干扰信息阅读
 * - 缓慢摇曳（flame-sway），不出现在交互层
 */
function FlameLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 375 812"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flame-stroke" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
      </defs>

      {/* 右上：一簇三根火苗线稿 */}
      <g className="flame-sway" opacity="0.13">
        <path
          d="M300 40 C296 74 318 92 316 118 C314 140 298 152 282 150 C266 148 256 132 262 114 C266 100 280 94 284 78 C288 64 292 52 300 40 Z"
          fill="none"
          stroke="url(#flame-stroke)"
          strokeWidth="1.2"
        />
        <path
          d="M284 76 C282 96 292 106 292 120 C292 132 284 140 274 138 C264 136 260 126 265 116 C268 108 276 104 278 94 C280 88 282 82 284 76 Z"
          fill="none"
          stroke="url(#flame-stroke)"
          strokeWidth="1"
        />
        <path
          d="M336 118 C334 134 344 142 344 154 C344 164 337 170 329 168 C321 166 318 158 322 150 C325 144 332 140 333 132 C334 127 335 122 336 118 Z"
          fill="none"
          stroke="url(#flame-stroke)"
          strokeWidth="1"
        />
      </g>

      {/* 左下：一簇小火苗 + 两根飘散火星线 */}
      <g className="flame-sway-slow" opacity="0.11">
        <path
          d="M60 660 C56 690 76 706 74 730 C72 750 56 760 42 757 C28 754 20 739 27 723 C32 711 46 706 50 691 C54 679 57 670 60 660 Z"
          fill="none"
          stroke="url(#flame-stroke)"
          strokeWidth="1.2"
        />
        <path
          d="M48 697 C47 711 56 718 55 729 C55 738 48 743 41 741 C34 739 32 731 36 725 C39 720 46 717 47 709"
          fill="none"
          stroke="url(#flame-stroke)"
          strokeWidth="1"
        />
        <path d="M96 742 C102 736 108 736 112 730" fill="none" stroke="url(#flame-stroke)" strokeWidth="1" />
        <path d="M30 624 C36 618 44 618 48 611" fill="none" stroke="url(#flame-stroke)" strokeWidth="1" />
        <path d="M104 676 C110 668 118 668 124 660" fill="none" stroke="url(#flame-stroke)" strokeWidth="1" />
      </g>

      {/* 底部右：极淡的大火苗轮廓 */}
      <g className="flame-sway" opacity="0.07">
        <path
          d="M310 560 C304 606 336 630 332 672 C329 704 305 722 282 718 C258 714 246 691 257 665 C264 648 284 640 290 618 C296 598 302 578 310 560 Z"
          fill="none"
          stroke="url(#flame-stroke)"
          strokeWidth="1.4"
        />
      </g>
    </svg>
  )
}

/**
 * 全局布局：白底火焰线稿风。
 * - 纯白背景（禁止黑底）+ 纤细红色线条火焰纹样底层氛围
 * - 外层一圈红色渐变细环（app-frame）
 * - 移动端优先（375px 基准），桌面居中限宽
 * 进入应用时检查月度预算，超支/接近超支给顶部横幅提示。
 */
export default function Layout() {
  const [banner, setBanner] = useState<{ level: 'warn' | 'over'; text: string } | null>(null)

  useEffect(() => {
    const budget = loadMonthlyBudget()
    if (!budget || budget <= 0) return
    const key = monthKey(currentMonth())
    const expense = sumAmounts(
      loadTransactions()
        .filter((t) => t.type === 'expense' && t.date.startsWith(key))
        .map((t) => t.amount),
    )
    if (expense >= budget) {
      setBanner({
        level: 'over',
        text: `本月已超支 ${formatAmount(expense - budget)}（预算 ${formatAmount(budget)}）`,
      })
    } else if (expense >= budget * 0.8) {
      setBanner({
        level: 'warn',
        text: `本月已用 ${Math.round((expense / budget) * 100)}%，预算还剩 ${formatAmount(budget - expense)}`,
      })
    }
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-gray-800">
      {/* 火焰线稿氛围层（纤细细红线条，仅底层） */}
      <FlameLines />

      {banner && (
        <div
          className={`relative z-10 px-4 py-2 text-center text-xs font-medium ${
            banner.level === 'over' ? 'bg-red-500/90 text-white' : 'bg-amber-50 text-amber-700'
          }`}
        >
          ⚠ {banner.text}
        </div>
      )}

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <TabBar />

      {/* 外层渐变边框（一圈红色细环，压在最上层但不挡点击） */}
      <div className="app-frame pointer-events-none fixed inset-0 z-40" aria-hidden="true" />
    </div>
  )
}
