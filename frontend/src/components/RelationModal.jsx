import { useState } from 'react'
import { useTreeStore } from '../stores/treeStore'
import { X, Link2 } from 'lucide-react'
import clsx from 'clsx'

const RELATION_TYPES = [
  { value: 'parent_child', label: '👨‍👧 Parent → Child', needsParentChild: true },
  { value: 'spouse',       label: '💍 Spouse / Married', needsPartner: true },
  { value: 'partner',      label: '🤝 Partner / Together', needsPartner: true },
  { value: 'sibling',      label: '👫 Siblings', needsPartner: true },
  { value: 'custom',       label: '✏️ Custom', needsPartner: true },
]

export default function RelationModal({ persons, onClose }) {
  const { addRelation } = useTreeStore()
  const [type, setType] = useState('parent_child')
  const [personA, setPersonA] = useState('')
  const [personB, setPersonB] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedType = RELATION_TYPES.find(r => r.value === type)

  const handleSave = async () => {
    if (!personA || !personB) { alert('Select both people'); return }
    if (personA === personB) { alert('Cannot link a person to themselves'); return }
    setSaving(true)
    const payload = { relation_type: type, label: label || null }
    if (type === 'parent_child') {
      payload.parent_id = parseInt(personA)
      payload.child_id = parseInt(personB)
    } else {
      payload.person_a_id = parseInt(personA)
      payload.person_b_id = parseInt(personB)
    }
    await addRelation(payload)
    setSaving(false)
    onClose()
  }

  const inp = 'w-full px-3 py-2 text-sm border border-bark-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-bark-300'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-parchment rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bark-200 bg-bark-800 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-leaf-300" />
            <h2 className="font-display font-semibold text-parchment text-sm">Add Relation</h2>
          </div>
          <button onClick={onClose} className="text-bark-300 hover:text-parchment"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-medium text-bark-600 block mb-1.5">Relationship Type</label>
            <div className="space-y-1.5">
              {RELATION_TYPES.map(r => (
                <button key={r.value} onClick={() => setType(r.value)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-all border',
                    type === r.value
                      ? 'bg-bark-700 text-parchment border-bark-600'
                      : 'bg-white border-bark-200 text-ink hover:border-bark-400'
                  )}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Person selects */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">
                {type === 'parent_child' ? 'Parent' : 'Person A'}
              </label>
              <select className={inp} value={personA} onChange={e => setPersonA(e.target.value)}>
                <option value="">Select…</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">
                {type === 'parent_child' ? 'Child' : 'Person B'}
              </label>
              <select className={inp} value={personB} onChange={e => setPersonB(e.target.value)}>
                <option value="">Select…</option>
                {persons.filter(p => p.id !== parseInt(personA)).map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom label */}
          {type === 'custom' && (
            <div>
              <label className="text-xs font-medium text-bark-600 block mb-1">Custom Label</label>
              <input className={inp} value={label} onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Godparent, Mentor…" />
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-bark-700 hover:bg-bark-800 text-parchment rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <Link2 size={15} />
            {saving ? 'Linking…' : 'Create Relation'}
          </button>
        </div>
      </div>
    </div>
  )
}
