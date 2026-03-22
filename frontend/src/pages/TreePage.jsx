import { useEffect, useState, useCallback, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, MarkerType,
  Panel, useReactFlow, ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTreeStore } from '../stores/treeStore'
import PersonNode from '../components/PersonNode'
import MindmapEdge from '../components/MindmapEdge'
import PersonPanel from '../components/PersonPanel'
import RelationTypePopup from '../components/RelationTypePopup'
import QuickAddModal from '../components/QuickAddModal'
import TreeToolbar from '../components/TreeToolbar'
import RelationModal from '../components/RelationModal'
import { TreePine } from 'lucide-react'

const nodeTypes = { person: PersonNode }
const edgeTypes = { mindmap: MindmapEdge }

const RELATION_COLORS = {
  parent_child: '#8b5e2a',
  spouse:       '#e91e8c',
  partner:      '#9c27b0',
  sibling:      '#2196f3',
  custom:       '#607d8b',
}
const RELATION_LABELS = {
  parent_child: '', spouse: '💍', partner: '🤝', sibling: '👫',
}

/**
 * Build edges using our custom mindmap type.
 * We pass relationType + label through data so MindmapEdge can style itself.
 * Source/target handles are chosen based on relative node positions so the
 * line exits the node in the most natural direction.
 */
function buildEdges(relations, nodePositions = {}) {
  return relations.map(r => {
    const isPC     = r.relation_type === 'parent_child'
    const sourceId = isPC ? String(r.parent_id)   : String(r.person_a_id)
    const targetId = isPC ? String(r.child_id)    : String(r.person_b_id)
    if (!sourceId || !targetId || sourceId === 'null' || targetId === 'null') return null

    // Pick best source/target handle pair based on relative positions
    const sp = nodePositions[sourceId] || { x: 0, y: 0 }
    const tp = nodePositions[targetId] || { x: 0, y: 0 }
    const dx = tp.x - sp.x
    const dy = tp.y - sp.y

    let sourceHandle, targetHandle
    if (isPC) {
      // Parent-child: prefer top→bottom; fall back to sides if very horizontal
      if (Math.abs(dy) >= Math.abs(dx) * 0.5) {
        sourceHandle = dy >= 0 ? 'bottom' : 'top'
        targetHandle = dy >= 0 ? 'top'    : 'bottom'
      } else {
        sourceHandle = dx >= 0 ? 'right' : 'left'
        targetHandle = dx >= 0 ? 'left'  : 'right'
      }
    } else {
      // Spouse/sibling/partner: prefer horizontal; fall back to vertical
      if (Math.abs(dx) >= Math.abs(dy) * 0.5) {
        sourceHandle = dx >= 0 ? 'right' : 'left'
        targetHandle = dx >= 0 ? 'left'  : 'right'
      } else {
        sourceHandle = dy >= 0 ? 'bottom' : 'top'
        targetHandle = dy >= 0 ? 'top'    : 'bottom'
      }
    }

    return {
      id: `r-${r.id}`,
      type: 'mindmap',
      source: sourceId,
      target: targetId,
      sourceHandle,
      targetHandle,
      markerEnd: isPC
        ? { type: MarkerType.ArrowClosed, color: RELATION_COLORS.parent_child, width: 16, height: 16 }
        : undefined,
      data: {
        relationType: r.relation_type,
        label: r.label || RELATION_LABELS[r.relation_type] || '',
      },
      animated: r.relation_type === 'spouse' || r.relation_type === 'partner',
    }
  }).filter(Boolean)
}

function autoLayout(persons, relations) {
  const childIds = new Set(
    relations.filter(r => r.relation_type === 'parent_child').map(r => String(r.child_id))
  )
  const generations = {}
  const assigned = new Set()
  persons.filter(p => !childIds.has(String(p.id))).forEach(p => {
    generations[String(p.id)] = 0; assigned.add(String(p.id))
  })
  let changed = true
  while (changed) {
    changed = false
    relations.filter(r => r.relation_type === 'parent_child').forEach(r => {
      const pid = String(r.parent_id), cid = String(r.child_id)
      if (assigned.has(pid) && !assigned.has(cid)) {
        generations[cid] = (generations[pid] || 0) + 1
        assigned.add(cid); changed = true
      }
    })
  }
  persons.forEach(p => { if (!assigned.has(String(p.id))) generations[String(p.id)] = 0 })
  const byGen = {}
  persons.forEach(p => {
    const g = generations[String(p.id)] ?? 0
    if (!byGen[g]) byGen[g] = []
    byGen[g].push(p)
  })
  const positions = {}
  Object.entries(byGen).forEach(([gen, ps]) => {
    const g = parseInt(gen)
    ps.forEach((p, i) => {
      positions[p.id] = { x: i * 240 - ((ps.length - 1) * 120), y: g * 230 }
    })
  })
  return positions
}

// Keep a ref map of current node positions for edge routing
function getNodePositions(nodes) {
  const map = {}
  nodes.forEach(n => { map[n.id] = n.position })
  return map
}

function TreeCanvas() {
  const {
    persons, relations, fetchTree, savePositions,
    deleteRelation, addRelation, addPerson,
    setSelectedPerson, selectedPerson,
  } = useTreeStore()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const [showPanel, setShowPanel]         = useState(false)
  const [isNewPerson, setIsNewPerson]     = useState(false)
  const [connectPopup, setConnectPopup]   = useState(null)
  const [quickAdd, setQuickAdd]           = useState(null)
  const [showRelationModal, setShowRelationModal] = useState(false)

  const positionTimer = useRef(null)
  const nodePositionsRef = useRef({})
  const { fitView } = useReactFlow()

  useEffect(() => { fetchTree() }, [])

  // Rebuild nodes
  useEffect(() => {
    const newNodes = persons.map((p, i) => ({
      id: String(p.id),
      type: 'person',
      position: { x: p.pos_x ?? (i % 5) * 240, y: p.pos_y ?? Math.floor(i / 5) * 210 },
      data: {
        ...p,
        onAddChild: (parentData) => {
          const parent = persons.find(x => x.id === parentData.id)
          if (parent) setQuickAdd({ parentPerson: parent })
        },
      },
      draggable: true,
    }))
    setNodes(newNodes)
    // Update position ref
    newNodes.forEach(n => { nodePositionsRef.current[n.id] = n.position })
  }, [persons])

  // Rebuild edges whenever relations OR node positions change
  useEffect(() => {
    setEdges(buildEdges(relations, nodePositionsRef.current))
  }, [relations, nodes])

  // ── Click node → edit panel ──────────────────────────────────────
  const onNodeClick = useCallback((_, node) => {
    const person = persons.find(p => String(p.id) === node.id)
    if (person) { setSelectedPerson(person); setIsNewPerson(false); setShowPanel(true) }
  }, [persons])

  // ── Click edge → delete ──────────────────────────────────────────
  const onEdgeClick = useCallback((e, edge) => {
    e.stopPropagation()
    const rId = parseInt(edge.id.replace('r-', ''))
    if (confirm('Remove this relation?')) deleteRelation(rId)
  }, [])

  // ── Drag node → save position + re-route edges ───────────────────
  const onNodesChangeWrapped = useCallback((changes) => {
    onNodesChange(changes)
    changes.forEach(c => {
      if (c.type === 'position' && c.position) {
        nodePositionsRef.current[c.id] = c.position
      }
    })
  }, [onNodesChange])

  const onNodeDragStop = useCallback((_, node) => {
    nodePositionsRef.current[node.id] = node.position
    // Re-route edges for this node
    setEdges(buildEdges(relations, nodePositionsRef.current))
    clearTimeout(positionTimer.current)
    positionTimer.current = setTimeout(() => {
      savePositions([{ person_id: parseInt(node.id), pos_x: node.position.x, pos_y: node.position.y }])
    }, 800)
  }, [relations])

  // ── Drag handle → connect → show relation type popup ─────────────
  const onConnect = useCallback((params) => {
    setConnectPopup({
      x: window.innerWidth  / 2 - 104,
      y: window.innerHeight / 2 - 150,
      sourceId: params.source,
      targetId: params.target,
    })
  }, [])

  const handleConnectSelect = async (relType) => {
    const { sourceId, targetId } = connectPopup
    setConnectPopup(null)
    const payload = { relation_type: relType }
    if (relType === 'parent_child') {
      payload.parent_id = parseInt(sourceId); payload.child_id  = parseInt(targetId)
    } else {
      payload.person_a_id = parseInt(sourceId); payload.person_b_id = parseInt(targetId)
    }
    await addRelation(payload)
  }

  // ── Quick-add child via + button ─────────────────────────────────
  const handleQuickAdd = async ({ name, gender, relType }) => {
    const { parentPerson } = quickAdd
    setQuickAdd(null)
    const parentNode = nodes.find(n => n.id === String(parentPerson.id))
    const siblings = relations.filter(r =>
      r.relation_type === 'parent_child' && r.parent_id === parentPerson.id
    )
    const newPerson = await addPerson({
      full_name: name, gender,
      pos_x: (parentNode?.position.x ?? 0) + siblings.length * 240,
      pos_y: (parentNode?.position.y ?? 0) + 230,
    })
    if (!newPerson) return
    const payload = { relation_type: relType }
    if (relType === 'parent_child') {
      payload.parent_id = parentPerson.id; payload.child_id  = newPerson.id
    } else {
      payload.person_a_id = parentPerson.id; payload.person_b_id = newPerson.id
    }
    await addRelation(payload)
  }

  // ── Auto layout ──────────────────────────────────────────────────
  const handleAutoLayout = useCallback(() => {
    const positions = autoLayout(persons, relations)
    setNodes(nds => nds.map(n => ({
      ...n, position: positions[parseInt(n.id)] || n.position
    })))
    Object.entries(positions).forEach(([id, pos]) => {
      nodePositionsRef.current[id] = pos
    })
    setTimeout(() => {
      setEdges(buildEdges(relations, nodePositionsRef.current))
      fitView({ padding: 0.15, duration: 600 })
    }, 50)
    const posArr = Object.entries(positions).map(([id, pos]) => ({
      person_id: parseInt(id), pos_x: pos.x, pos_y: pos.y
    }))
    savePositions(posArr)
  }, [persons, relations])

  const handleAddPerson = () => {
    setSelectedPerson(null); setIsNewPerson(true); setShowPanel(true)
  }
  const handleClosePanel = () => {
    setShowPanel(false); setSelectedPerson(null); setIsNewPerson(false)
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        {persons.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <TreePine size={56} className="text-bark-300 mb-4" />
            <p className="text-bark-400 font-display text-xl">Your family tree is empty</p>
            <p className="text-bark-300 text-sm mt-1">Click <strong>Add Person</strong> to start, or use the <strong>+</strong> on any node</p>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWrapped}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2.5}
          deleteKeyCode={null}
          connectOnClick={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#c8a870" gap={30} size={1} style={{ opacity: 0.2 }} />
          <Controls />
          <MiniMap
            nodeColor={n => {
              const g = n.data?.gender
              return g === 'male' ? '#93c5fd' : g === 'female' ? '#f9a8d4' : '#d4a060'
            }}
            maskColor="rgba(250,243,224,0.7)"
          />

          <Panel position="top-left" className="m-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-bark-200 p-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-bark-100">
                <TreePine size={16} className="text-leaf-600" />
                <span className="font-display font-semibold text-ink text-sm">Family Tree</span>
                <span className="text-xs text-bark-400 font-mono">{persons.length} members</span>
              </div>
              <TreeToolbar
                onAddPerson={handleAddPerson}
                onAddRelation={() => setShowRelationModal(true)}
                onAutoLayout={handleAutoLayout}
              />
            </div>
          </Panel>

          <Panel position="bottom-center" className="mb-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-bark-200 px-4 py-2 flex items-center gap-4 text-xs text-bark-500 shadow">
              <span>🖱️ <strong>Click</strong> node to edit</span>
              <span>＋ <strong>Hover</strong> node → + to add child</span>
              <span>↔ <strong>Drag</strong> handle dot to link</span>
              <span>🗑️ <strong>Click</strong> line to delete</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {showPanel && (
        <div className="w-72 flex-shrink-0 border-l border-bark-200 shadow-xl overflow-hidden">
          <PersonPanel person={isNewPerson ? null : selectedPerson} onClose={handleClosePanel} />
        </div>
      )}

      {connectPopup && (
        <RelationTypePopup
          x={connectPopup.x} y={connectPopup.y}
          sourceId={connectPopup.sourceId} targetId={connectPopup.targetId}
          persons={persons}
          onSelect={handleConnectSelect}
          onClose={() => setConnectPopup(null)}
        />
      )}

      {quickAdd && (
        <QuickAddModal
          parentPerson={quickAdd.parentPerson}
          onConfirm={handleQuickAdd}
          onClose={() => setQuickAdd(null)}
        />
      )}

      {showRelationModal && (
        <RelationModal persons={persons} onClose={() => setShowRelationModal(false)} />
      )}
    </div>
  )
}

export default function TreePage() {
  return (
    <ReactFlowProvider>
      <div className="h-full"><TreeCanvas /></div>
    </ReactFlowProvider>
  )
}
