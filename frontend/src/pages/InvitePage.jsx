import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Mail, Send, Check, X, Link2, Unlink, Copy, Users } from 'lucide-react'
import clsx from 'clsx'

export default function InvitePage() {
  const [sent, setSent] = useState([])
  const [received, setReceived] = useState([])
  const [linked, setLinked] = useState([])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [shareMode, setShareMode] = useState('full')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('send')

  const fetchAll = async () => {
    try {
      const [s, r, l] = await Promise.all([
        api.get('/api/invitations/sent'),
        api.get('/api/invitations/received'),
        api.get('/api/invitations/linked-trees'),
      ])
      setSent(s.data)
      setReceived(r.data)
      setLinked(l.data)
    } catch (e) {
      toast.error('Failed to load invitations')
    }
  }

  useEffect(() => { fetchAll() }, [])

  const sendInvite = async () => {
    if (!email) { toast.error('Enter an email address'); return }
    setLoading(true)
    try {
      await api.post('/api/invitations/', { recipient_email: email, message, share_mode: shareMode })
      toast.success('Invitation sent!')
      setEmail(''); setMessage('')
      fetchAll()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send invitation')
    }
    setLoading(false)
  }

  const acceptInvite = async (token) => {
    try {
      await api.post('/api/invitations/accept', { token })
      toast.success('Invitation accepted! Trees are now linked.')
      fetchAll()
    } catch (e) {
      toast.error('Failed to accept invitation')
    }
  }

  const declineInvite = async (token) => {
    try {
      await api.post(`/api/invitations/decline/${token}`)
      toast.success('Invitation declined')
      fetchAll()
    } catch (e) {
      toast.error('Failed to decline invitation')
    }
  }

  const revokeLink = async (linkId) => {
    if (!confirm('Remove this family link? They will no longer see your shared members.')) return
    try {
      await api.delete(`/api/invitations/links/${linkId}`)
      toast.success('Link removed')
      fetchAll()
    } catch (e) {
      toast.error('Failed to remove link')
    }
  }

  const copyInviteLink = (token) => {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Invite link copied!')
  }

  const statusColor = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-600',
    expired: 'bg-gray-100 text-gray-500',
    revoked: 'bg-gray-100 text-gray-500',
  }

  const tabs = [
    { id: 'send', label: 'Send Invite', icon: Send },
    { id: 'received', label: `Received ${received.length ? `(${received.length})` : ''}`, icon: Mail },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'linked', label: `Linked (${linked.length})`, icon: Link2 },
  ]

  const inp = 'w-full px-3 py-2 text-sm border border-bark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-bark-300'

  return (
    <div className="h-full flex flex-col bg-parchment overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-bark-200 bg-bark-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-leaf-500 flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-parchment text-lg">Family Invitations</h1>
            <p className="text-bark-300 text-xs">Connect and share your family trees</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bark-200 bg-white overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-b-2 border-bark-500 text-bark-700'
                : 'text-bark-400 hover:text-bark-600'
            )}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* SEND TAB */}
        {tab === 'send' && (
          <div className="max-w-lg">
            <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-5 space-y-4">
              <h2 className="font-display font-semibold text-ink">Invite a Family Member</h2>
              <p className="text-sm text-bark-500">
                Send an invitation to link your family tree with someone else's.
                They'll be able to see the members you mark as "Shared".
              </p>
              <div>
                <label className="text-xs font-medium text-bark-600 block mb-1">Their Email</label>
                <input className={inp} type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="family@example.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-bark-600 block mb-1">Personal Message (optional)</label>
                <textarea className={inp + ' resize-none'} rows={3} value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Hey! I'm building our family tree and thought we could connect..." />
              </div>
              <div>
                <label className="text-xs font-medium text-bark-600 block mb-1.5">What you'll share</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'full', label: '🌿 All shared members', desc: 'Anyone marked as Shared' },
                    { value: 'partial', label: '🔒 Review first', desc: 'You choose after linking' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setShareMode(opt.value)}
                      className={clsx(
                        'text-left p-3 rounded-xl border text-sm transition-all',
                        shareMode === opt.value
                          ? 'border-bark-500 bg-bark-50 text-bark-700'
                          : 'border-bark-200 bg-white text-bark-500 hover:border-bark-300'
                      )}>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={sendInvite} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-bark-700 hover:bg-bark-800 text-parchment rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60">
                <Send size={15} />
                {loading ? 'Sending…' : 'Send Invitation'}
              </button>
            </div>
          </div>
        )}

        {/* RECEIVED TAB */}
        {tab === 'received' && (
          <div className="max-w-lg space-y-3">
            {received.length === 0 && (
              <div className="text-center py-12 text-bark-400">
                <Mail size={40} className="mx-auto mb-3 opacity-40" />
                <p>No pending invitations</p>
              </div>
            )}
            {received.map(inv => (
              <div key={inv.id} className="bg-white rounded-2xl border border-bark-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink text-sm">Invitation from</p>
                    <p className="text-bark-500 text-xs mt-0.5">{inv.recipient_email}</p>
                    {inv.message && (
                      <p className="text-sm text-bark-600 mt-2 italic">"{inv.message}"</p>
                    )}
                    <p className="text-xs text-bark-400 mt-2">
                      Share mode: <span className="font-medium">{inv.share_mode}</span>
                    </p>
                  </div>
                  <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', statusColor[inv.status])}>
                    {inv.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => acceptInvite(inv.token)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-leaf-600 hover:bg-leaf-700 text-white rounded-lg py-2 text-xs font-medium transition-colors">
                    <Check size={13} /> Accept
                  </button>
                  <button onClick={() => declineInvite(inv.token)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg py-2 text-xs font-medium transition-colors border border-red-200">
                    <X size={13} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SENT TAB */}
        {tab === 'sent' && (
          <div className="max-w-lg space-y-3">
            {sent.length === 0 && (
              <div className="text-center py-12 text-bark-400">
                <Send size={40} className="mx-auto mb-3 opacity-40" />
                <p>No sent invitations yet</p>
              </div>
            )}
            {sent.map(inv => (
              <div key={inv.id} className="bg-white rounded-2xl border border-bark-200 shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink text-sm">{inv.recipient_email}</p>
                    <p className="text-xs text-bark-400 mt-0.5">
                      Sent {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', statusColor[inv.status])}>
                    {inv.status}
                  </span>
                </div>
                {inv.status === 'pending' && (
                  <button onClick={() => copyInviteLink(inv.token)}
                    className="mt-3 w-full flex items-center justify-center gap-2 border border-bark-200 hover:bg-bark-50 text-bark-600 rounded-lg py-1.5 text-xs font-medium transition-colors">
                    <Copy size={12} /> Copy invite link
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* LINKED TAB */}
        {tab === 'linked' && (
          <div className="max-w-lg space-y-3">
            {linked.length === 0 && (
              <div className="text-center py-12 text-bark-400">
                <Link2 size={40} className="mx-auto mb-3 opacity-40" />
                <p>No linked families yet</p>
                <p className="text-sm mt-1">Send an invitation to get started</p>
              </div>
            )}
            {linked.map(link => (
              <div key={link.link_id} className="bg-white rounded-2xl border border-bark-200 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-leaf-100 flex items-center justify-center text-leaf-700 font-display font-bold flex-shrink-0">
                    {(link.full_name || link.username)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-ink text-sm">{link.full_name || link.username}</p>
                    <p className="text-xs text-bark-400">{link.email}</p>
                    {link.contact_person_name && (
                      <p className="text-xs text-leaf-600 mt-0.5 flex items-center gap-1">
                        <Link2 size={10} />
                        Linked via <strong>{link.contact_person_name}</strong>
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => revokeLink(link.link_id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="Remove link">
                  <Unlink size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
