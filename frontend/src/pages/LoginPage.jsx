import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { TreePine, Eye, EyeOff } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, loading, token } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (token) navigate('/')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) {
      // Handle pending invite
      const pending = localStorage.getItem('pendingInvite')
      if (pending) {
        localStorage.removeItem('pendingInvite')
        navigate(`/invite/${pending}`)
      } else {
        navigate('/')
      }
    }
  }

  const inp = 'w-full px-4 py-2.5 text-sm border border-bark-200 rounded-xl bg-parchment focus:outline-none focus:ring-2 focus:ring-bark-400 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-bark-900 flex items-center justify-center p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-leaf-900/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-bark-700/30 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-bark-700 border border-bark-600 flex items-center justify-center shadow-xl mb-4">
            <TreePine size={28} className="text-leaf-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-parchment">FamilyTree</h1>
          <p className="text-bark-400 text-sm mt-1">Your family, beautifully connected</p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-parchment rounded-2xl shadow-2xl border border-bark-700 overflow-hidden">
          <div className="p-6 space-y-4">
            <h2 className="font-display font-semibold text-ink text-lg">Welcome back</h2>

            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">Email</label>
              <input className={inp} type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>

            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">Password</label>
              <div className="relative">
                <input className={inp + ' pr-10'} type={show ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-600">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-bark-700 hover:bg-bark-800 text-parchment rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60 shadow">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>

          <div className="px-6 py-4 bg-bark-50 border-t border-bark-200 text-center">
            <p className="text-sm text-bark-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-bark-700 font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
