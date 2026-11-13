import { useNavigate } from 'react-router-dom'

/** 子页面的返回导航头（我的页下的二级页面用） */
export default function SubPageHeader({ title }: { title: string }) {
  const navigate = useNavigate()
  return (
    <header className="mb-4 flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
        onClick={() => navigate('/profile')}
        aria-label="返回"
      >
        ‹
      </button>
      <h1 className="text-lg font-bold">{title}</h1>
    </header>
  )
}
