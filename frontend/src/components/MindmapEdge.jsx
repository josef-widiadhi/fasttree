import { BaseEdge, EdgeLabelRenderer, getBezierPath, getStraightPath } from '@xyflow/react'

const COLORS = {
  parent_child: '#8b5e2a',
  spouse:       '#e91e8c',
  partner:      '#9c27b0',
  sibling:      '#2196f3',
  custom:       '#607d8b',
}

const DASH = {
  spouse:  '6 3',
  partner: '4 4',
  sibling: '8 3',
  custom:  '3 3',
}

/**
 * Organic mindmap-style curved edge.
 * - parent_child: smooth bezier top→bottom with arrow
 * - spouse/partner: horizontal bezier with dashes
 * - sibling: gentle arc
 */
export default function MindmapEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data = {}, markerEnd, style = {},
}) {
  const relType = data.relationType || 'custom'
  const color   = COLORS[relType] || '#8b5e2a'
  const dash    = DASH[relType]

  // Always use bezier for organic curves — ignore ReactFlow's automatic
  // sourcePosition/targetPosition and compute our own control points
  // based on the relative position of source vs target.
  const dx = targetX - sourceX
  const dy = targetY - sourceY

  let path, labelX, labelY

  if (relType === 'parent_child') {
    // Vertical-biased bezier: control points push toward vertical flow
    const cpY = Math.abs(dy) * 0.5
    path = `M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + cpY}, ${targetX} ${targetY - cpY}, ${targetX} ${targetY}`
    labelX = (sourceX + targetX) / 2
    labelY = (sourceY + targetY) / 2
  } else if (relType === 'spouse' || relType === 'partner') {
    // Horizontal-biased bezier for same-generation links
    const cpX = Math.abs(dx) * 0.5
    const cpY = Math.min(Math.abs(dy) * 0.3, 40) * (dy > 0 ? 1 : -1)
    path = `M ${sourceX} ${sourceY} C ${sourceX + cpX} ${sourceY + cpY}, ${targetX - cpX} ${targetY - cpY}, ${targetX} ${targetY}`
    labelX = (sourceX + targetX) / 2
    labelY = (sourceY + targetY) / 2 - 10
  } else {
    // Generic organic: let angle determine curve direction
    const dist  = Math.sqrt(dx * dx + dy * dy)
    const curve = dist * 0.35
    // Perpendicular offset for a nice arc
    const nx = -dy / dist * curve
    const ny =  dx / dist * curve
    const mx = (sourceX + targetX) / 2 + nx
    const my = (sourceY + targetY) / 2 + ny
    path = `M ${sourceX} ${sourceY} Q ${mx} ${my}, ${targetX} ${targetY}`
    labelX = mx
    labelY = my
  }

  const label = data.label

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: relType === 'parent_child' ? 2.5 : 2,
          strokeDasharray: dash,
          fill: 'none',
          ...style,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              fontSize: 14,
              background: 'rgba(250,243,224,0.9)',
              borderRadius: 6,
              padding: '1px 4px',
              border: `1px solid ${color}44`,
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
