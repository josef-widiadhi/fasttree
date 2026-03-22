import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { TreePine, Check, X, LogIn, Link2, User, ChevronRight, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

const genderColor = g =>
  g === 'male' ? 'bg-blue-400' : g === 'female' ? 'bg-pink-400' : 'bg-bark-400'

export default function AcceptInvitePage() {
  const { token }                   = useParams()
  const { token: authToken }        = useAuthStore()
  const navigate                    = useNavigate()

  const [invitation, setInvitation] = useState(null)   // enriched by backend
  const [myPersons, setMyPersons]   = useState([])     // recipient's own tree
  const [yourPersonId, setYourPersonId] = useState(null) // chosen "me" node
  const [step, setStep]             = useState('review') // review | pick | done
  const [loading, setLoading]       = useState(true)
  const [accepting, setAccepting]   = useState(false)

  // Load invitation details
  useEffect(() => {
    api.get(`/api/invitations/token/${token}`)
      .then(r => setInvitation(r.data))
      .catch(() => toast.error('Invitation not found or expired'))
      .finally(() => setLoading(false))
  }, [token])

  // If logged in, also load their own tree persons
  useEffect(() => {
    if (!authToken) return
    api.get('/api/persons/tree')
      .then(r => setMyPersons(r.data.persons.filter(p => {
        // Only show persons they own (not linked ones from other trees)
        return true // owner_id check happens server-side; all returned are accessible
      })))
      .catch(() => {})
  }, [authToken])

  const handleAccept = async () => {
    if (!authToken) {
      localStorage.setItem('pendingInvite', token)
      navigate('/login')
      return
    }
    // If recipient has their own tree and hasn't picked "me" yet, go to pick step
    if (myPersons.length > 0 && yourPersonId === null && step === 'review') {
      setStep('pick')
      return
    }
    setAccepting(true)
    try {
      await api.post('/api/invitations/accept', {
        token,
        your_person_id: yourPersonId ?? undefined,
      })
      toast.success('Trees linked! 🌳')
      setStep('done')
      setTimeout(() => navigate('/'), 1800)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to accept')
    }
    setAccepting(false)
  }

  const handleDecline = async () => {
    try {
      await api.post(`/api/invitations/decline/${token}`)
    } catch {}
    navigate('/')
  }

  const skipPick = () => {
    setYourPersonId(null)
    setStep('accepting')
    handleAcceptDirect()
  }

  const handleAcceptDirect = async () => {
    setAccepting(true)
    try {
      await api.post('/api/invitations/accept', { token, your_person_id: undefined })
      toast.success('Trees linked! 🌳')
      setStep('done')
      setTimeout(() => navigate('/'), 1800)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to accept')
    }
    setAccepting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-bark-900 flex items-center justify-center">
      <div className="text-bark-400 animate-pulse font-display text-lg">Loading…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-leaf-900/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-bark-700/30 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-bark-700 border border-bark-600 flex items-center justify-center shadow-xl mb-3">
            <TreePine size={24} className="text-leaf-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-parchment">FamilyTree</h1>
        </div>

        <div className="bg-parchment rounded-2xl shadow-2xl border border-bark-700 overflow-hidden">

          {/* ── STEP: done ──────────────────────────────── */}
          {step === 'done' && (
            <div className="p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-leaf-500 flex items-center justify-center mx-auto">
                <Check size={32} className="text-white" />
              </div>
              <p className="font-display font-bold text-ink text-xl">Trees linked!</p>
              <p className="text-bark-500 text-sm">Redirecting to your tree…</p>
            </div>
          )}

          {/* ── STEP: pick your person ───────────────────── */}
          {step === 'pick' && invitation && (
            <>
              <div className="bg-bark-800 px-5 py-4">
                <h2 className="font-display font-bold text-parchment text-lg">Which person are you?</h2>
                <p className="text-bark-300 text-xs mt-1">
                  {invitation.sender_name} tagged{' '}
                  <strong className="text-parchment">"{invitation.contact_person_name}"</strong>{' '}
                  as you. Select the matching person from your own tree so both sides connect correctly.
                </p>
              </div>

              {/* Bridge diagram */}
              <div className="flex items-center justify-center gap-2 py-4 px-5 bg-bark-700/30 border-b border-bark-200">
                {/* Their side */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-bark-500 flex items-center justify-center text-white text-xs font-bold">
                    {invitation.contact_person_name?.[0] || '?'}
                  </div>
                  <p className="text-xs text-bark-600 font-medium text-center leading-tight max-w-[80px] truncate">
                    {invitation.contact_person_name}
                  </p>
                  <p className="text-xs text-bark-400">their tree</p>
                </div>
                <div className="flex-1 flex items-center justify-center gap-1">
                  <div className="flex-1 h-px bg-leaf-400 border-dashed border-t border-leaf-400" />
                  <Link2 size={16} className="text-leaf-500 flex-shrink-0" />
                  <div className="flex-1 h-px bg-leaf-400 border-dashed border-t border-leaf-400" />
                </div>
                {/* My side */}
                <div className="flex flex-col items-center gap-1">
                  {yourPersonId ? (
                    <>
                      <div className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold',
                        genderColor(myPersons.find(p => p.id === yourPersonId)?.gender)
                      )}>
                        {myPersons.find(p => p.id === yourPersonId)?.full_name?.[0]}
                      </div>
                      <p className="text-xs text-bark-600 font-medium text-center leading-tight max-w-[80px] truncate">
                        {myPersons.find(p => p.id === yourPersonId)?.full_name}
                      </p>
                    </>
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-bark-400 flex items-center justify-center">
                      <User size={16} className="text-bark-400" />
                    </div>
                  )}
                  <p className="text-xs text-bark-400">your tree</p>
                </div>
              </div>

              {/* Person list */}
              <div className="max-h-56 overflow-y-auto divide-y divide-bark-100">
                {myPersons.length === 0 ? (
                  <div className="p-4 text-center text-bark-400 text-sm">No persons in your tree yet</div>
                ) : (
                  myPersons.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setYourPersonId(p.id)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        yourPersonId === p.id
                          ? 'bg-leaf-50 border-l-4 border-leaf-500'
                          : 'hover:bg-bark-50 border-l-4 border-transparent'
                      )}
                    >
                      <div className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                        genderColor(p.gender)
                      )}>
                        {p.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{p.full_name}</p>
                        {p.birthday && (
                          <p className="text-xs text-bark-400">🎂 {p.birthday.slice(0, 4)}</p>
                        )}
                      </div>
                      {yourPersonId === p.id && <Check size={15} className="text-leaf-600 flex-shrink-0" />}
                    </button>
                  ))
                )}
              </div>

              <div className="p-4 space-y-2">
                <button
                  onClick={handleAccept}
                  disabled={accepting || !yourPersonId}
                  className="w-full flex items-center justify-center gap-2 bg-leaf-600 hover:bg-leaf-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Link2 size={15} />
                  {accepting ? 'Linking…' : 'Confirm & Link Trees'}
                </button>
                <button
                  onClick={skipPick}
                  disabled={accepting}
                  className="w-full text-center text-xs text-bark-400 hover:text-bark-600 py-1.5 transition-colors"
                >
                  Skip — link trees without a matching person
                </button>
              </div>
            </>
          )}

          {/* ── STEP: review invitation ───────────────────── */}
          {step === 'review' && (
            <>
              <div className="bg-bark-800 px-6 py-5">
                <h2 className="font-display font-bold text-parchment text-xl">You're invited!</h2>
                <p className="text-bark-300 text-sm mt-0.5">
                  {invitation?.sender_name
                    ? <><strong className="text-parchment">{invitation.sender_name}</strong> wants to link family trees with you</>
                    : 'Someone wants to connect your family tree'}
                </p>
              </div>

              <div className="p-5 space-y-3">
                {!invitation ? (
                  <p className="text-bark-500 text-center py-4">Invitation not found or has expired.</p>
                ) : (
                  <>
                    {/* Contact person context */}
                    {invitation.contact_person_name && (
                      <div className="bg-leaf-50 border border-leaf-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-leaf-700 uppercase tracking-wide mb-2">Point of contact</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-leaf-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {invitation.contact_person_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink">{invitation.contact_person_name}</p>
                            <p className="text-xs text-leaf-600">
                              {invitation.sender_name} has tagged this person as <strong>you</strong> in their tree.
                              {myPersons.length > 0
                                ? ' You\'ll pick your matching person in the next step.'
                                : ' Your tree will link here automatically.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Personal message */}
                    {invitation.message && (
                      <div className="bg-white border border-bark-200 rounded-xl p-4">
                        <p className="text-sm text-bark-700 italic">"{invitation.message}"</p>
                        {invitation.sender_name && (
                          <p className="text-xs text-bark-400 mt-1">— {invitation.sender_name}</p>
                        )}
                      </div>
                    )}

                    {/* Share mode */}
                    <div className="flex items-center gap-2 text-xs text-bark-500 bg-white border border-bark-200 rounded-xl px-3 py-2.5">
                      <Link2 size={13} className="text-bark-400 flex-shrink-0" />
                      Sharing: <span className="font-medium text-ink">
                        {invitation.share_mode === 'full' ? 'All members marked as "Shared"' : 'Selected members only'}
                      </span>
                    </div>

                    {/* Already actioned */}
                    {invitation.status !== 'pending' ? (
                      <div className="text-center py-3">
                        <p className="text-bark-500 text-sm">
                          This invitation was already <strong>{invitation.status}</strong>.
                        </p>
                        <Link to="/" className="text-leaf-600 font-medium text-sm underline mt-2 block">
                          Go to my tree →
                        </Link>
                      </div>
                    ) : (
                      <>
                        {/* Not logged in */}
                        {!authToken && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                            <LogIn size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700">
                              <Link to={`/login`} onClick={() => localStorage.setItem('pendingInvite', token)}
                                className="font-semibold underline">Sign in</Link> or{' '}
                              <Link to={`/register`} onClick={() => localStorage.setItem('pendingInvite', token)}
                                className="font-semibold underline">create an account</Link>{' '}
                              to accept. The point-of-contact link will be set up automatically.
                            </p>
                          </div>
                        )}

                        {/* What will happen */}
                        {authToken && myPersons.length > 0 && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                            <ArrowRight size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-700">
                              Since you already have a tree with <strong>{myPersons.length} person{myPersons.length !== 1 ? 's' : ''}</strong>,
                              you'll pick which person represents <em>you</em> in the next step so both trees connect at the right node.
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="flex-1 flex items-center justify-center gap-2 bg-leaf-600 hover:bg-leaf-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
                          >
                            <Check size={15} />
                            {accepting ? 'Linking…'
                              : !authToken ? 'Sign in to Accept'
                              : myPersons.length > 0 ? 'Accept & Pick My Person'
                              : 'Accept & Link Trees'}
                          </button>
                          <button
                            onClick={handleDecline}
                            className="flex items-center justify-center gap-1.5 border border-bark-200 hover:bg-bark-50 text-bark-600 bg-white rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                          >
                            <X size={14} /> Decline
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
