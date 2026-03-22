import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { TreePine, Check, X, LogIn, Link2, User } from 'lucide-react'

export default function AcceptInvitePage() {
  const { token }              = useParams()
  const { user, token: authToken } = useAuthStore()
  const navigate               = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [senderName, setSenderName] = useState(null)
  const [contactPerson, setContactPerson] = useState(null)
  const [loading, setLoading]  = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    api.get(`/api/invitations/token/${token}`)
      .then(async r => {
        setInvitation(r.data)
        // If there's a contact_person_id we can try to fetch its name
        // (only works if the recipient is already logged in, otherwise we skip)
        if (r.data.contact_person_id && authToken) {
          try {
            const tree = await api.get('/api/persons/tree')
            // The contact person belongs to the sender, not our tree — just show the id
          } catch {}
        }
      })
      .catch(() => toast.error('Invitation not found or expired'))
      .finally(() => setLoading(false))
  }, [token, authToken])

  const handleAccept = async () => {
    if (!authToken) {
      localStorage.setItem('pendingInvite', token)
      navigate('/login')
      return
    }
    setAccepting(true)
    try {
      await api.post('/api/invitations/accept', { token })
      toast.success('Invitation accepted! Trees are now linked.')
      navigate('/')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to accept invitation')
    }
    setAccepting(false)
  }

  const handleDecline = async () => {
    try {
      await api.post(`/api/invitations/decline/${token}`)
      toast.success('Invitation declined')
      navigate('/')
    } catch { navigate('/') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-bark-400 animate-pulse font-display">Loading invitation…</div>
      </div>
    )
  }

  const contactInitials = invitation?.contact_person_id ? '?' : null

  return (
    <div className="min-h-screen bg-bark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-leaf-900/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-bark-700/30 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-bark-700 border border-bark-600 flex items-center justify-center shadow-xl mb-4">
            <TreePine size={28} className="text-leaf-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-parchment">FamilyTree</h1>
          <p className="text-bark-400 text-sm mt-1">Family tree invitation</p>
        </div>

        <div className="bg-parchment rounded-2xl shadow-2xl border border-bark-700 overflow-hidden">
          <div className="bg-bark-800 px-6 py-5">
            <h2 className="font-display font-bold text-parchment text-xl">You're invited!</h2>
            <p className="text-bark-300 text-sm mt-1">Someone wants to connect your family tree</p>
          </div>

          <div className="p-6 space-y-4">
            {invitation ? (
              <>
                {/* Point-of-contact highlight */}
                {invitation.contact_person_id && (
                  <div className="bg-leaf-50 border border-leaf-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-leaf-500 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-leaf-800">You're being added to their tree</p>
                        <p className="text-xs text-leaf-600 mt-0.5">
                          When you accept, your tree will automatically link at the person they tagged as you.
                          No manual linking needed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message */}
                {invitation.message && (
                  <div className="bg-white border border-bark-200 rounded-xl p-4">
                    <p className="text-sm text-bark-700 italic">"{invitation.message}"</p>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm text-bark-500 bg-white border border-bark-200 rounded-xl px-4 py-3">
                  <Link2 size={15} className="text-bark-400 flex-shrink-0" />
                  <span>
                    Share mode: <span className="font-medium text-ink">
                      {invitation.share_mode === 'full' ? 'All shared members visible' : 'Selected members'}
                    </span>
                  </span>
                </div>

                {invitation.status !== 'pending' ? (
                  <div className="text-center py-4">
                    <p className="text-bark-500 text-sm">This invitation has already been <strong>{invitation.status}</strong>.</p>
                    <Link to="/" className="text-bark-700 font-medium text-sm underline mt-2 block">Go to my tree →</Link>
                  </div>
                ) : (
                  <>
                    {!authToken && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                        <LogIn size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                          <Link to="/login" className="font-semibold underline">Sign in</Link> or{' '}
                          <Link to="/register" className="font-semibold underline">create an account</Link> to accept this invitation.
                          Your trees will auto-link once you do.
                        </p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={handleAccept} disabled={accepting}
                        className="flex-1 flex items-center justify-center gap-2 bg-leaf-600 hover:bg-leaf-700 text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-60">
                        <Check size={15} />
                        {accepting ? 'Linking trees…' : authToken ? 'Accept & Link Trees' : 'Sign in to Accept'}
                      </button>
                      <button onClick={handleDecline}
                        className="flex items-center justify-center gap-2 border border-bark-200 hover:bg-bark-50 text-bark-600 bg-white rounded-xl px-4 py-3 text-sm font-medium transition-colors">
                        <X size={15} />
                        Decline
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-bark-500">Invitation not found or has expired.</p>
                <Link to="/" className="text-bark-700 font-medium text-sm underline mt-2 block">Go home</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
