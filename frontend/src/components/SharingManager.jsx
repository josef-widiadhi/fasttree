import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Users, User, Check, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const genderColor = g =>
  g === 'male' ? 'bg-blue-400' : g === 'female' ? 'bg-pink-400' : 'bg-bark-400'

const genderBorder = g =>
  g === 'male' ? 'border-blue-200' : g === 'female' ? 'border-pink-200' : 'border-bark-200'

export default function SharingManager({ link, onClose }) {
  // link = { link_id, user_id, username, full_name, email, contact_person_name }
  const [persons, setPersons]     = useState([])  // { person_id, full_name, gender, birthday, shared }
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [filter, setFilter]       = useState('all') // all | shared | private
  const [search, setSearch]       = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/persons/sharing/${link.link_id}`)
      setPersons(data)
    } catch { toast.error('Failed to load sharing status') }
    setLoading(false)
  }

  useEffect(() => { load() }, [link.link_id])

  const sharedCount  = persons.filter(p => p.shared).length
  const privateCount = persons.length - sharedCount

  // Toggle a single person
  const toggle = async (person) => {
    const newShared = !person.shared
    // Optimistic update
    setPersons(ps => ps.map(p => p.person_id === person.person_id ? { ...p, shared: newShared } : p))
    try {
      await api.post('/api/persons/sharing/batch', {
        person_ids: [person.person_id],
        link_id: link.link_id,
        shared: newShared,
      })
    } catch {
      // Rollback
      setPersons(ps => ps.map(p => p.person_id === person.person_id ? { ...p, shared: !newShared } : p))
      toast.error('Failed to update')
    }
  }

  // Share all / unshare all
  const setAll = async (shared) => {
    setSaving(true)
    try {
      await api.post(`/api/persons/sharing/all?link_id=${link.link_id}&broadcast=${shared}`)
      setPersons(ps => ps.map(p => ({ ...p, shared })))
      toast.success(shared ? 'All persons shared' : 'All persons made private')
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  // Share selection
  const [selected, setSelected] = useState(new Set())
  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })
  const applyToSelected = async (shared) => {
    if (selected.size === 0) return
    setSaving(true)
    try {
      await api.post('/api/persons/sharing/batch', {
        person_ids: [...selected],
        link_id: link.link_id,
        shared,
      })
      setPersons(ps => ps.map(p =>
        selected.has(p.person_id) ? { ...p, shared } : p
      ))
      setSelected(new Set())
      toast.success(`${selected.size} person(s) updated`)
    } catch { toast.error('Failed to update') }
    setSaving(false)
  }

  const filtered = persons.filter(p => {
    if (filter === 'shared'  && !p.shared) return false
    if (filter === 'private' &&  p.shared) return false
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-parchment rounded-2xl shadow-2xl border border-bark-200 w-full max-w-md pointer-events-auto animate-slide-up flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="bg-bark-800 px-5 py-4 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-leaf-600 flex items-center justify-center text-white font-bold text-sm">
                  {(link.full_name || link.username)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-parchment font-semibold text-sm">{link.full_name || link.username}</p>
                  <p className="text-bark-400 text-xs">Manage what you share with them</p>
                </div>
              </div>
              <button onClick={onClose} className="text-bark-400 hover:text-parchment transition-colors">
                <X size={17} />
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-1.5 bg-leaf-700/40 rounded-lg px-3 py-1.5">
                <Eye size={12} className="text-leaf-300" />
                <span className="text-leaf-200 text-xs font-medium">{sharedCount} shared</span>
              </div>
              <div className="flex items-center gap-1.5 bg-bark-700/60 rounded-lg px-3 py-1.5">
                <EyeOff size={12} className="text-bark-400" />
                <span className="text-bark-300 text-xs font-medium">{privateCount} private</span>
              </div>
              {link.contact_person_name && (
                <div className="flex items-center gap-1.5 bg-bark-700/60 rounded-lg px-3 py-1.5">
                  <Shield size={12} className="text-bark-400" />
                  <span className="text-bark-300 text-xs font-medium">via {link.contact_person_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bulk actions */}
          <div className="px-4 py-3 border-b border-bark-200 bg-white flex-shrink-0 space-y-2">
            {/* Quick share-all / private-all */}
            <div className="flex gap-2">
              <button onClick={() => setAll(true)} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-leaf-600 hover:bg-leaf-700 text-white rounded-xl py-2 text-xs font-medium transition-colors disabled:opacity-50">
                <Users size={13} /> Share all
              </button>
              <button onClick={() => setAll(false)} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-bark-100 hover:bg-bark-200 text-bark-700 rounded-xl py-2 text-xs font-medium transition-colors disabled:opacity-50">
                <EyeOff size={13} /> Make all private
              </button>
            </div>

            {/* Selection bulk actions */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2 bg-bark-50 rounded-xl px-3 py-2">
                <span className="text-xs text-bark-600 font-medium flex-1">{selected.size} selected</span>
                <button onClick={() => applyToSelected(true)} disabled={saving}
                  className="flex items-center gap-1 text-xs text-leaf-700 hover:text-leaf-900 font-medium">
                  <Eye size={12} /> Share
                </button>
                <span className="text-bark-300">·</span>
                <button onClick={() => applyToSelected(false)} disabled={saving}
                  className="flex items-center gap-1 text-xs text-bark-600 hover:text-bark-800 font-medium">
                  <EyeOff size={12} /> Private
                </button>
                <span className="text-bark-300">·</span>
                <button onClick={() => setSelected(new Set())}
                  className="text-xs text-bark-400 hover:text-bark-600">
                  Clear
                </button>
              </div>
            )}

            {/* Search + filter */}
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-1.5 text-xs border border-bark-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-bark-300"
                placeholder="Search by name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="flex rounded-lg border border-bark-200 overflow-hidden">
                {[
                  { id: 'all',     label: 'All' },
                  { id: 'shared',  label: '👁 Shared' },
                  { id: 'private', label: '🔒 Private' },
                ].map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    className={clsx(
                      'px-2.5 py-1.5 text-xs font-medium transition-colors',
                      filter === f.id ? 'bg-bark-700 text-parchment' : 'bg-white text-bark-500 hover:bg-bark-50'
                    )}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Person list */}
          <div className="flex-1 overflow-y-auto divide-y divide-bark-100">
            {loading ? (
              <div className="py-10 text-center text-bark-400 text-sm animate-pulse">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-bark-400 text-sm">No persons found</div>
            ) : (
              filtered.map(p => (
                <div
                  key={p.person_id}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 transition-colors',
                    selected.has(p.person_id) ? 'bg-bark-50' : 'hover:bg-bark-50/50'
                  )}
                >
                  {/* Checkbox for bulk select */}
                  <button
                    onClick={() => toggleSelect(p.person_id)}
                    className={clsx(
                      'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                      selected.has(p.person_id)
                        ? 'bg-bark-700 border-bark-700'
                        : 'border-bark-300 bg-white hover:border-bark-500'
                    )}
                  >
                    {selected.has(p.person_id) && <Check size={10} className="text-white" />}
                  </button>

                  {/* Avatar */}
                  <div className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border-2',
                    genderColor(p.gender), genderBorder(p.gender)
                  )}>
                    {p.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{p.full_name}</p>
                    {(p.nickname || p.birthday) && (
                      <p className="text-xs text-bark-400">
                        {p.nickname && <span>"{p.nickname}" </span>}
                        {p.birthday && <span>🎂 {p.birthday.slice(0,4)}</span>}
                      </p>
                    )}
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => toggle(p)}
                    className={clsx(
                      'relative w-11 h-6 rounded-full transition-colors flex-shrink-0 flex items-center',
                      p.shared ? 'bg-leaf-500' : 'bg-bark-300'
                    )}
                    title={p.shared ? 'Visible to them — click to make private' : 'Private — click to share'}
                  >
                    <span className={clsx(
                      'absolute w-5 h-5 rounded-full bg-white shadow transition-all',
                      p.shared ? 'left-[22px]' : 'left-[2px]'
                    )} />
                    <span className={clsx(
                      'absolute text-xs transition-all',
                      p.shared ? 'left-1.5 text-white' : 'right-1 text-bark-500'
                    )}>
                      {p.shared ? <Eye size={10} /> : <EyeOff size={10} />}
                    </span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-bark-200 bg-white rounded-b-2xl flex-shrink-0">
            <p className="text-xs text-bark-400 text-center">
              Changes save instantly. Only people you toggle <Eye size={10} className="inline" /> on are visible to {link.full_name || link.username}.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
