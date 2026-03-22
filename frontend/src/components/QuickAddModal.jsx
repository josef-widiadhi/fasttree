import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'

const GENDERS = ['male', 'female', 'other', 'unknown']

// Lightweight quick-add — just name + gender + relation type
// Full details can be edited by clicking the node afterwards
export default function QuickAddModal({ parentPerson, onConfirm, onClose }) {
  const [name, setName]     = useState('')
  const [gender, setGender] = useState('unknown')
  const [relType, setRelType] = useState('parent_child')
  const [saving, setSaving]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onConfirm({ name: name.trim(), gender, relType })
    setSaving(false)
  }

  const inp = 'w-full px-3 py-2 text-sm border border-bark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-bark-300'

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="bg-parchment rounded-2xl shadow-2xl border border-bark-200 w-full max-w-xs pointer-events-auto animate-slide-up"
        >
          <div className="bg-bark-800 px-5 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus size={15} className="text-leaf-300" />
              <div>
                <p className="text-parchment font-semibold text-sm">Add person</p>
                {parentPerson && (
                  <p className="text-bark-400 text-xs">
                    child of {parentPerson.full_name}
                  </p>
                )}
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-bark-400 hover:text-parchment">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">Full Name *</label>
              <input
                autoFocus
                className={inp}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter full name…"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1.5">Gender</label>
              <div className="grid grid-cols-4 gap-1.5">
                {GENDERS.map(g => (
                  <button
                    key={g} type="button"
                    onClick={() => setGender(g)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      gender === g
                        ? g === 'male'   ? 'bg-blue-400 text-white border-blue-400'
                        : g === 'female' ? 'bg-pink-400 text-white border-pink-400'
                        : g === 'other'  ? 'bg-purple-400 text-white border-purple-400'
                        :                  'bg-bark-600 text-white border-bark-600'
                        : 'bg-white border-bark-200 text-bark-500 hover:border-bark-400'
                    }`}
                  >
                    {g === 'unknown' ? '?' : g.slice(0,1).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {parentPerson && (
              <div>
                <label className="text-xs font-medium text-bark-600 block mb-1.5">Relationship</label>
                <div className="space-y-1">
                  {[
                    { value: 'parent_child', label: '👨‍👧 Child of ' + parentPerson.full_name },
                    { value: 'spouse',       label: '💍 Spouse of '  + parentPerson.full_name },
                    { value: 'sibling',      label: '👫 Sibling of ' + parentPerson.full_name },
                  ].map(r => (
                    <button
                      key={r.value} type="button"
                      onClick={() => setRelType(r.value)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all border ${
                        relType === r.value
                          ? 'bg-bark-700 text-parchment border-bark-600'
                          : 'bg-white border-bark-200 text-bark-600 hover:border-bark-400'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit" disabled={saving || !name.trim()}
              className="w-full bg-bark-700 hover:bg-bark-800 text-parchment rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50 mt-1"
            >
              {saving ? 'Adding…' : 'Add & Connect'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
