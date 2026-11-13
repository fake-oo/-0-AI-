import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: '明细' },
  { to: '/charts', label: '图表' },
  { to: '/profile', label: '我的' },
] as const

/**
 * 底部 Tab 导航：三板块切换，拇指易触达。
 */
export default function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center py-2 text-sm ${
                isActive ? 'font-semibold text-red-600' : 'text-gray-500'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
