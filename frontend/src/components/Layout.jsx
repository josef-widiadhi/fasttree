import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { GitBranch, Mail, LogOut, User, TreePine } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 md:w-56 flex-shrink-0 bg-bark-800 text-bark-100 flex flex-col shadow-2xl z-10">
        {/* Logo */}
        <div className="p-4 border-b border-bark-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-leaf-500 flex items-center justify-center flex-shrink-0">
            <TreePine size={18} className="text-white" />
          </div>
          <span className="hidden md:block font-display font-bold text-lg text-parchment">FamilyTree</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 pt-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive ? 'bg-bark-600 text-parchment' : 'text-bark-300 hover:bg-bark-700 hover:text-parchment'
              }`
            }
          >
            <GitBranch size={18} className="flex-shrink-0" />
            <span className="hidden md:block">My Tree</span>
          </NavLink>

          <NavLink
            to="/invitations"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive ? 'bg-bark-600 text-parchment' : 'text-bark-300 hover:bg-bark-700 hover:text-parchment'
              }`
            }
          >
            <Mail size={18} className="flex-shrink-0" />
            <span className="hidden md:block">Invitations</span>
          </NavLink>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-bark-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-bark-600 flex items-center justify-center flex-shrink-0">
              <User size={15} className="text-bark-200" />
            </div>
            <div className="hidden md:block min-w-0">
              <p className="text-xs font-semibold text-parchment truncate">{user?.full_name || user?.username}</p>
              <p className="text-xs text-bark-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-bark-400 hover:bg-bark-700 hover:text-parchment transition-all text-sm"
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className="hidden md:block">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
