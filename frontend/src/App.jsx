import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TreePage from './pages/TreePage'
import InvitePage from './pages/InvitePage'
import AcceptInvitePage from './pages/AcceptInvitePage'
import Layout from './components/Layout'

function Protected({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/:token" element={<AcceptInvitePage />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<TreePage />} />
        <Route path="invitations" element={<InvitePage />} />
      </Route>
    </Routes>
  )
}
