import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import TransactionsPage from './pages/TransactionsPage'
import ChartsPage from './pages/ChartsPage'
import ProfilePage from './pages/ProfilePage'
import BudgetPage from './pages/BudgetPage'
import CategoryManagerPage from './pages/CategoryManagerPage'
import ImportPage from './pages/ImportPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* 明细页为默认首页 */}
        <Route index element={<TransactionsPage />} />
        <Route path="charts" element={<ChartsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        {/* 我的页下的二级页面 */}
        <Route path="budget" element={<BudgetPage />} />
        <Route path="categories" element={<CategoryManagerPage />} />
        <Route path="import" element={<ImportPage />} />
      </Route>
    </Routes>
  )
}

export default App
