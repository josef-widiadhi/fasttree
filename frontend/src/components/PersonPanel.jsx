import { useState, useEffect } from 'react'
import { useTreeStore } from '../stores/treeStore'
import { useAuthStore } from '../stores/authStore'
import {
  X, Save, Trash2, Plus, Minus, User, Phone, Mail, MapPin,
  FileText, UserPlus
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import InviteFromPersonModal from './InviteFromPersonModal'

const GENDERS = ['male', 'female', 'other', 'unknown']

export default function PersonPanel({ person, onClose }) {
  const { updatePerson, deletePerson, addPerson } = useTreeStore()
  const currentUser = useAuthStore(s => s.user)
  const isOwn = person ? person.owner_id === currentUser?.id : true

  const blank = {
    full_name: '', nickname: '', gender: 'unknown', birthday: '',
    birth_place: '', death_date: '', is_deceased: false,
    phone: '', email: '', address: '', avatar_url: '',
    notes: '', visibility: 'private', extra_fields: {}
  }

  const [form, setForm]           = useState(person ? { ...person, extra_fields: person.extra_fields || {} } : blank)
  const [tab, setTab]             = useState('basic')
  const [saving, setSaving]       = useState(false)
  const [newFieldKey, setNewFieldKey] = useState('')
  const [showInvite, setShowInvite]   = useState(false)

  useEffect(() => {
    if (person) setForm({ ...person, extra_fields: person.extra_fields || {} })
    else setForm(blank)
    setTab('basic')
  }, [person?.id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    if (person) {
      await updatePerson(person.id, form)
    } else {
      const created = await addPerson(form)
      if (created) onClose()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${person.full_name}? This cannot be undone.`)) return
    await deletePerson(person.id)
    onClose()
  }

  const addExtraField = () => {
    const key = newFieldKey.trim()
    if (!key) { toast.error('Field name required'); return }
    if (form.extra_fields[key] !== undefined) { toast.error('Field already exists'); return }
    setForm(f => ({ ...f, extra_fields: { ...f.extra_fields, [key]: '' } }))
    setNewFieldKey('')
  }

  const removeExtraField = (key) => {
    const ef = { ...form.extra_fields }
    delete ef[key]
    setForm(f => ({ ...f, extra_fields: ef }))
  }

  const tabs = [
    { id: 'basic',   label: 'Basic' },
    { id: 'contact', label: 'Contact' },
    { id: 'extra',   label: 'Extra' },
    { id: 'notes',   label: 'Notes' },
  ]

  const inp = 'w-full px-3 py-1.5 text-sm border border-bark-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-bark-300 focus:border-transparent disabled:bg-bark-50 disabled:text-bark-500 transition'

  const genderInitials = (form.full_name || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <div className="h-full flex flex-col bg-parchment animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bark-200 bg-bark-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-leaf-500 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <h2 className="font-display font-semibold text-parchment text-sm">
              {person ? (isOwn ? 'Edit Person' : 'View Person') : 'Add Person'}
            </h2>
          </div>
          <button onClick={onClose} className="text-bark-300 hover:text-parchment transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Avatar + invite button */}
        <div className="flex justify-center py-4 bg-bark-700 relative">
          <div className={clsx(
            'w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-bold text-white shadow-lg',
            form.gender === 'male'   ? 'bg-blue-400'  :
            form.gender === 'female' ? 'bg-pink-400'  : 'bg-bark-400'
          )}>
            {form.avatar_url
              ? <img src={form.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              : genderInitials
            }
          </div>

          {/* Invite button — only for existing own persons that aren't the current user */}
          {person && isOwn && (
            <button
              onClick={() => setShowInvite(true)}
              title="Invite this person to join FamilyTree"
              className={clsx(
                'absolute right-4 top-1/2 -translate-y-1/2',
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
                'bg-leaf-600 hover:bg-leaf-700 text-white text-xs font-medium',
                'transition-all shadow-sm'
              )}
            >
              <UserPlus size={13} />
              Invite
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-bark-200 bg-white">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={clsx(
                'flex-1 py-2 text-xs font-medium transition-colors',
                tab === t.id
                  ? 'border-b-2 border-bark-500 text-bark-700'
                  : 'text-bark-400 hover:text-bark-600'
              )}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {tab === 'basic' && (
            <>
              <Field label="Full Name *">
                <input className={inp} value={form.full_name} disabled={!isOwn}
                  onChange={e => set('full_name', e.target.value)} placeholder="Full name" />
              </Field>
              <Field label="Nickname">
                <input className={inp} value={form.nickname || ''} disabled={!isOwn}
                  onChange={e => set('nickname', e.target.value)} placeholder="Nickname or alias" />
              </Field>
              <Field label="Gender">
                <select className={inp} value={form.gender || 'unknown'} disabled={!isOwn}
                  onChange={e => set('gender', e.target.value)}>
                  {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Birthday">
                <input className={inp} type="date" value={form.birthday || ''} disabled={!isOwn}
                  onChange={e => set('birthday', e.target.value)} />
              </Field>
              <Field label="Birth Place">
                <input className={inp} value={form.birth_place || ''} disabled={!isOwn}
                  onChange={e => set('birth_place', e.target.value)} placeholder="City, Country" />
              </Field>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="deceased" checked={form.is_deceased} disabled={!isOwn}
                  onChange={e => set('is_deceased', e.target.checked)} className="rounded border-bark-300" />
                <label htmlFor="deceased" className="text-xs text-bark-600">Deceased</label>
              </div>
              {form.is_deceased && (
                <Field label="Death Date">
                  <input className={inp} type="date" value={form.death_date || ''} disabled={!isOwn}
                    onChange={e => set('death_date', e.target.value)} />
                </Field>
              )}
              <Field label="Avatar URL">
                <input className={inp} value={form.avatar_url || ''} disabled={!isOwn}
                  onChange={e => set('avatar_url', e.target.value)} placeholder="https://…" />
              </Field>
              {isOwn && (
                <Field label="Visibility">
                  <select className={inp} value={form.visibility} onChange={e => set('visibility', e.target.value)}>
                    <option value="private">🔒 Private (only me)</option>
                    <option value="shared">🌿 Shared (linked families)</option>
                  </select>
                </Field>
              )}
            </>
          )}

          {tab === 'contact' && (
            <>
              <Field label="Phone" icon={<Phone size={13} />}>
                <input className={inp} value={form.phone || ''} disabled={!isOwn}
                  onChange={e => set('phone', e.target.value)} placeholder="+62 812 3456 7890" />
              </Field>
              <Field label="Email" icon={<Mail size={13} />}>
                <input className={inp} type="email" value={form.email || ''} disabled={!isOwn}
                  onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
              </Field>
              <Field label="Address" icon={<MapPin size={13} />}>
                <textarea className={inp + ' resize-none'} rows={3} value={form.address || ''} disabled={!isOwn}
                  onChange={e => set('address', e.target.value)} placeholder="Full address…" />
              </Field>
            </>
          )}

          {tab === 'extra' && (
            <>
              <p className="text-xs text-bark-500">Add any custom fields for this person.</p>
              {Object.entries(form.extra_fields || {}).map(([key, val]) => (
                <div key={key} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <label className="text-xs text-bark-500 mb-0.5 block capitalize">{key}</label>
                    <input className={inp} value={val} disabled={!isOwn}
                      onChange={e => setForm(f => ({ ...f, extra_fields: { ...f.extra_fields, [key]: e.target.value } }))}
                      placeholder={`Value for ${key}`} />
                  </div>
                  {isOwn && (
                    <button onClick={() => removeExtraField(key)}
                      className="mt-5 text-red-400 hover:text-red-600 transition-colors">
                      <Minus size={14} />
                    </button>
                  )}
                </div>
              ))}
              {isOwn && (
                <div className="flex gap-2 mt-2">
                  <input className={inp + ' flex-1'} value={newFieldKey}
                    onChange={e => setNewFieldKey(e.target.value)}
                    placeholder="Field name (e.g. occupation)"
                    onKeyDown={e => e.key === 'Enter' && addExtraField()} />
                  <button onClick={addExtraField}
                    className="px-3 py-1.5 bg-leaf-500 text-white rounded-lg text-xs hover:bg-leaf-600 transition-colors flex items-center gap-1">
                    <Plus size={13} /> Add
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'notes' && (
            <Field label="Notes" icon={<FileText size={13} />}>
              <textarea className={inp + ' resize-none'} rows={8} value={form.notes || ''} disabled={!isOwn}
                onChange={e => set('notes', e.target.value)}
                placeholder="Stories, memories, anything about this person…" />
            </Field>
          )}
        </div>

        {/* Footer actions */}
        {isOwn && (
          <div className="p-3 border-t border-bark-200 bg-white flex gap-2">
            {person && (
              <button onClick={handleDelete}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete person">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-bark-700 hover:bg-bark-800 text-parchment rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-60">
              <Save size={14} />
              {saving ? 'Saving…' : person ? 'Save Changes' : 'Add Person'}
            </button>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && person && (
        <InviteFromPersonModal
          person={person}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  )
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-bark-600 mb-1">
        {icon}{label}
      </label>
      {children}
    </div>
  )
}
