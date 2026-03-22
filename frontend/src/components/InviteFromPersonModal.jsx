import { useState, useEffect } from 'react'
import { X, Mail, Send, Copy, Check, Clock, Link2 } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function InviteFromPersonModal({ person, onClose }) {
  const [email, setEmail]       = useState(person.email || '')
  const [message, setMessage]   = useState('')
  const [shareMode, setShareMode] = useState('full')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(null)   // { token, recipient_email }
  const [existing, setExisting] = useState(null)   // existing pending invite
  const [copied, setCopied]     = useState(false)

  // On open, check if there's already a pending invite for this person
  useEffect(() => {
    api.get(`/api/invitations/check-person/${person.id}`)
      .then(r => setExisting(r.data))
      .catch(() => {}) // 404 = none, that's fine
  }, [person.id])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Enter an email address'); return }
    setSending(true)
    try {
      const { data } = await api.post('/api/invitations/', {
        recipient_email: email.trim(),
        message,
        share_mode: shareMode,
        contact_person_id: person.id,   // ← the key field
      })
      setSent(data)
      toast.success('Invitation sent!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send invitation')
    }
    setSending(false)
  }

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Invite link copied!')
  }

  const inp = 'w-full px-3 py-2 text-sm border border-bark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-bark-300'

  const personInitials = person.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-parchment rounded-2xl shadow-2xl border border-bark-200 w-full max-w-sm pointer-events-auto animate-slide-up overflow-hidden">

          {/* Header */}
          <div className="bg-bark-800 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={clsx(
                'w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0',
                person.gender === 'male' ? 'bg-blue-400' :
                person.gender === 'female' ? 'bg-pink-400' : 'bg-bark-500'
              )}>
                {personInitials}
              </div>
              <div>
                <p className="text-parchment font-semibold text-sm leading-tight">{person.full_name}</p>
                <p className="text-bark-400 text-xs">Invite to join as this person</p>
              </div>
            </div>
            <button onClick={onClose} className="text-bark-400 hover:text-parchment transition-colors">
              <X size={17} />
            </button>
          </div>

          {/* Existing pending invite banner */}
          {existing && !sent && (
            <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <Clock size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-800 font-medium">Pending invite already exists</p>
                <p className="text-xs text-amber-600 mt-0.5 truncate">Sent to {existing.recipient_email}</p>
                <button
                  onClick={() => copyLink(existing.token)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-medium"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy invite link'}
                </button>
              </div>
            </div>
          )}

          {/* Success state */}
          {sent ? (
            <div className="p-5 space-y-4">
              <div className="bg-leaf-50 border border-leaf-200 rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-leaf-500 flex items-center justify-center mx-auto mb-2">
                  <Check size={20} className="text-white" />
                </div>
                <p className="font-semibold text-leaf-800 text-sm">Invitation sent!</p>
                <p className="text-xs text-leaf-600 mt-1">
                  Sent to <strong>{sent.recipient_email}</strong>
                </p>
                <p className="text-xs text-leaf-600 mt-0.5">
                  When they join, they'll automatically be linked as <strong>{person.full_name}</strong> in your tree.
                </p>
              </div>

              <div>
                <p className="text-xs text-bark-500 mb-2 text-center">Or share the invite link directly:</p>
                <button
                  onClick={() => copyLink(sent.token)}
                  className="w-full flex items-center justify-center gap-2 border border-bark-300 hover:bg-bark-50 text-bark-700 rounded-xl py-2.5 text-sm font-medium transition-colors"
                >
                  {copied ? <Check size={15} className="text-leaf-600" /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy invite link'}
                </button>
              </div>

              <button onClick={onClose}
                className="w-full bg-bark-700 hover:bg-bark-800 text-parchment rounded-xl py-2.5 text-sm font-medium transition-colors">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="p-5 space-y-4">
              {/* How it works */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                <Link2 size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  When the invitee accepts and creates their account, their tree will automatically
                  connect to <strong>{person.full_name}</strong> in your tree — no manual linking needed.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-bark-600 block mb-1">
                  <Mail size={12} className="inline mr-1" />Email address
                </label>
                <input
                  className={inp}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="their@email.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-bark-600 block mb-1">Personal message (optional)</label>
                <textarea
                  className={inp + ' resize-none'}
                  rows={2}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Hey! I've added you as ${person.full_name} in my family tree…`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-bark-600 block mb-1.5">What you'll share with them</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'full',    label: '🌿 All shared',    desc: 'All "Shared" members' },
                    { value: 'partial', label: '🔒 Review first',  desc: 'You choose after link' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setShareMode(opt.value)}
                      className={clsx(
                        'text-left p-2.5 rounded-xl border text-xs transition-all',
                        shareMode === opt.value
                          ? 'border-bark-500 bg-bark-50 text-bark-700'
                          : 'border-bark-200 bg-white text-bark-500 hover:border-bark-300'
                      )}>
                      <div className="font-medium">{opt.label}</div>
                      <div className="opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-bark-700 hover:bg-bark-800 text-parchment rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60">
                <Send size={14} />
                {sending ? 'Sending…' : `Invite as ${person.full_name}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
