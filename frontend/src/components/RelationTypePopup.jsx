import clsx from 'clsx'

// Small popup that appears when user drops a connection between two nodes
const TYPES = [
  { value: 'parent_child', label: '👨‍👧 Parent → Child', color: 'text-bark-700' },
  { value: 'spouse',       label: '💍 Spouse',           color: 'text-pink-600' },
  { value: 'partner',      label: '🤝 Partner',          color: 'text-purple-600' },
  { value: 'sibling',      label: '👫 Sibling',          color: 'text-blue-600' },
  { value: 'custom',       label: '✏️ Custom…',          color: 'text-gray-600' },
]

export default function RelationTypePopup({ x, y, sourceId, targetId, persons, onSelect, onClose }) {
  const source = persons.find(p => String(p.id) === sourceId)
  const target = persons.find(p => String(p.id) === targetId)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <div
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-bark-200 overflow-hidden animate-scale-in w-52"
        style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 280) }}
      >
        <div className="bg-bark-800 px-4 py-3">
          <p className="text-parchment text-xs font-medium truncate">
            {source?.full_name} → {target?.full_name}
          </p>
          <p className="text-bark-400 text-xs mt-0.5">Choose relationship type</p>
        </div>
        <div className="p-1.5 space-y-0.5">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => onSelect(t.value)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-bark-50',
                t.color
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="px-3 pb-3">
          <button onClick={onClose}
            className="w-full text-center text-xs text-bark-400 hover:text-bark-600 py-1">
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
