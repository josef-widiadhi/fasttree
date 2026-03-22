import { Handle, Position } from '@xyflow/react'
import { Shield, Plus } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import clsx from 'clsx'

const genderColors = {
  male:    { bg: 'bg-blue-50',   border: 'border-blue-300',   avatar: 'bg-blue-400',   dot: 'bg-blue-400' },
  female:  { bg: 'bg-pink-50',   border: 'border-pink-300',   avatar: 'bg-pink-400',   dot: 'bg-pink-400' },
  other:   { bg: 'bg-purple-50', border: 'border-purple-300', avatar: 'bg-purple-400', dot: 'bg-purple-400' },
  unknown: { bg: 'bg-amber-50',  border: 'border-amber-300',  avatar: 'bg-bark-400',   dot: 'bg-amber-400' },
}

// Each side gets BOTH a source and target handle with a named id
// so our edge builder can choose the right exit point per relation type.
const HANDLE_SIDES = [
  { id: 'top',    position: Position.Top,    style: { left: '50%', top: -6 } },
  { id: 'bottom', position: Position.Bottom, style: { left: '50%', bottom: -6 } },
  { id: 'left',   position: Position.Left,   style: { top: '50%', left: -6 } },
  { id: 'right',  position: Position.Right,  style: { top: '50%', right: -6 } },
]

export default function PersonNode({ data, selected }) {
  const currentUser = useAuthStore(s => s.user)
  const isOwn = data.owner_id === currentUser?.id
  const colors = genderColors[data.gender] || genderColors.unknown

  const initials = (data.full_name || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleAddChild = (e) => {
    e.stopPropagation()
    if (data.onAddChild) data.onAddChild(data)
  }

  return (
    <div
      className={clsx(
        'relative rounded-2xl border-2 shadow-md transition-all duration-150 select-none group',
        'w-36 bg-white',
        colors.border,
        selected && 'ring-2 ring-bark-500 ring-offset-2 shadow-2xl scale-105 z-10',
        !isOwn && 'opacity-85'
      )}
    >
      {/* Named handles on all 4 sides — both source & target on each */}
      {HANDLE_SIDES.map(({ id, position, style }) => (
        <span key={id}>
          <Handle
            type="source"
            id={id}
            position={position}
            style={style}
            className={clsx(
              '!w-3.5 !h-3.5 !rounded-full !border-2 !border-white',
              '!opacity-0 group-hover:!opacity-100',
              'transition-all duration-150 cursor-crosshair',
              id === 'top' || id === 'bottom' ? '!bg-bark-500' : '!bg-leaf-500'
            )}
          />
          <Handle
            type="target"
            id={id}
            position={position}
            style={style}
            className={clsx(
              '!w-3.5 !h-3.5 !rounded-full !border-2 !border-white',
              '!opacity-0 group-hover:!opacity-100',
              'transition-all duration-150',
              id === 'top' || id === 'bottom' ? '!bg-bark-500' : '!bg-leaf-500'
            )}
          />
        </span>
      ))}

      <div className={clsx('px-3 pt-3 pb-2.5 rounded-xl', colors.bg)}>
        {/* Avatar */}
        <div className="flex justify-center mb-2 relative">
          {data.avatar_url ? (
            <img
              src={data.avatar_url} alt={data.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'border-2 border-white shadow font-display font-bold text-base text-white',
              colors.avatar
            )}>
              {initials}
            </div>
          )}
        </div>

        {/* Name */}
        <p className="text-center font-semibold text-xs text-ink leading-tight truncate" title={data.full_name}>
          {data.full_name}
        </p>
        {data.nickname && (
          <p className="text-center text-xs text-bark-500 italic truncate">"{data.nickname}"</p>
        )}
        {data.birthday && (
          <p className="text-center text-xs text-bark-400 mt-0.5">
            🎂 {data.birthday.slice(0, 4)}
          </p>
        )}

        {/* Badges row */}
        <div className="flex justify-center gap-1 mt-1.5">
          <span className={clsx('w-2 h-2 rounded-full', colors.dot)} title={data.gender} />
          {data.is_deceased && <span className="text-xs leading-none" title="Deceased">✝</span>}
          {!isOwn && <Shield size={10} className="text-bark-400" title="Linked family" />}
        </div>
      </div>

      {/* Quick-add child — shown only for own nodes on hover */}
      {isOwn && (
        <button
          onMouseDown={handleAddChild}
          title="Add child / linked person"
          className={clsx(
            'absolute -bottom-5 left-1/2 -translate-x-1/2 z-20',
            'w-7 h-7 rounded-full shadow-lg border-2 border-white',
            'flex items-center justify-center',
            'bg-bark-700 text-white',
            'opacity-0 group-hover:opacity-100',
            'hover:bg-leaf-600 hover:scale-110',
            'transition-all duration-150'
          )}
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
