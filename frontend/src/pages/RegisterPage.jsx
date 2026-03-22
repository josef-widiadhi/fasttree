import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { TreePine, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const { register, loading, token } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' })
  const [show, setShow] = useState(false)

  useEffect(() => { if (token) navigate('/') }, [token])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await register(form.email, form.username, form.password, form.full_name)
    if (ok) navigate('/')
  }

  const inp = 'w-full px-4 py-2.5 text-sm border border-bark-200 rounded-xl bg-parchment focus:outline-none focus:ring-2 focus:ring-bark-400 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-bark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full bg-leaf-900/20 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full bg-bark-700/30 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-bark-700 border border-bark-600 flex items-center justify-center shadow-xl mb-4">
            <TreePine size={28} className="text-leaf-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-parchment">FamilyTree</h1>
          <p className="text-bark-400 text-sm mt-1">Start building your family story</p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-parchment rounded-2xl shadow-2xl border border-bark-700 overflow-hidden">
          <div className="p-6 space-y-4">
            <h2 className="font-display font-semibold text-ink text-lg">Create your account</h2>

            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">Full Name</label>
              <input className={inp} value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
            </div>

            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">Username</label>
              <input className={inp} value={form.username} onChange={set('username')}
                placeholder="username" required minLength={3} />
            </div>

            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">Email</label>
              <input className={inp} type="email" value={form.email} onChange={set('email')}
                placeholder="your@email.com" required />
            </div>

            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">Password</label>
              <div className="relative">
                <input className={inp + ' pr-10'} type={show ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder="Minimum 6 characters" required minLength={6} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-600">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-bark-700 hover:bg-bark-800 text-parchment rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60 shadow">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </div>

          <div className="px-6 py-4 bg-bark-50 border-t border-bark-200 text-center">
            <p className="text-sm text-bark-500">
              Already have an account?{' '}
              <Link to="/login" className="text-bark-700 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
