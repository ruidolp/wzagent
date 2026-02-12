'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import Link from 'next/link'
import { Save, Plus, ChevronDown, Download, Upload, Trash2 } from 'lucide-react'

import { useFlowEditorStore } from './store'
import CustomNode from './components/CustomNode'
import NodePalette from './components/NodePalette'
import PropertiesPanel from './components/PropertiesPanel'

const nodeTypes = {
  text: CustomNode,
  menu: CustomNode,
  buttons: CustomNode,
  capture_data: CustomNode,
  condition: CustomNode,
  ai: CustomNode,
}

interface Tenant {
  id: string
  name: string
  slug: string
}

interface Flow {
  id: string
  name: string
  description?: string
}

function FlowEditorContent() {
  const {
    nodes,
    edges,
    selectedNode,
    selectedTenantId,
    selectedFlowId,
    flowName,
    flowDescription,
    isDirty,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    setSelectedTenant,
    setSelectedFlow,
    setFlowName,
    setFlowDescription,
    resetFlow,
    setIsDirty,
  } = useFlowEditorStore()

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showNewFlowDialog, setShowNewFlowDialog] = useState(false)
  const [newFlowName, setNewFlowName] = useState('')
  const [newFlowDescription, setNewFlowDescription] = useState('')

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { project } = useReactFlow()

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    if (selectedTenantId) {
      fetchFlows()
    }
  }, [selectedTenantId])

  useEffect(() => {
    if (selectedFlowId && selectedTenantId) {
      loadFlow()
    }
  }, [selectedFlowId])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants')
      const data = await response.json()
      setTenants(data.tenants)
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlows = async () => {
    if (!selectedTenantId) return

    try {
      const response = await fetch(`/api/admin/flows?tenantId=${selectedTenantId}`)
      const data = await response.json()
      setFlows(data.flows)
    } catch (error) {
      console.error('Error fetching flows:', error)
    }
  }

  const loadFlow = async () => {
    if (!selectedFlowId) return

    try {
      const response = await fetch(`/api/admin/flows/${selectedFlowId}`)
      const data = await response.json()

      setFlowName(data.flow.name)
      setFlowDescription(data.flow.description || '')

      // Convert nodes to React Flow format
      const flowNodes = data.nodes.map((node: any) => ({
        id: node.id,
        type: node.node_type,
        position: node.position || { x: 100, y: 100 },
        data: {
          label: node.config.label || getDefaultLabel(node.node_type),
          config: node.config,
          transitions: node.transitions,
        },
      }))

      // Convert transitions to edges
      const flowEdges: any[] = []
      data.nodes.forEach((node: any) => {
        if (node.transitions) {
          Object.entries(node.transitions).forEach(([key, targetId]) => {
            flowEdges.push({
              id: `${node.id}-${targetId}`,
              source: node.id,
              target: targetId as string,
              label: key !== 'default' ? key : undefined,
            })
          })
        }
      })

      setNodes(flowNodes)
      setEdges(flowEdges)
      setIsDirty(false)
    } catch (error) {
      console.error('Error loading flow:', error)
    }
  }

  const handleCreateFlow = async () => {
    if (!selectedTenantId || !newFlowName) return

    try {
      const response = await fetch('/api/admin/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          name: newFlowName,
          description: newFlowDescription,
          triggerType: 'manual',
        }),
      })

      const data = await response.json()
      await fetchFlows()
      setSelectedFlow(data.flow.id)
      setShowNewFlowDialog(false)
      setNewFlowName('')
      setNewFlowDescription('')
    } catch (error) {
      console.error('Error creating flow:', error)
      alert('Error al crear el flujo')
    }
  }

  const handleSaveFlow = async () => {
    if (!selectedFlowId) {
      alert('Selecciona o crea un flujo primero')
      return
    }

    // Validate flow before saving
    const validation = validateFlow(nodes, edges)
    if (!validation.valid) {
      alert(`Error de validación:\n${validation.errors.join('\n')}`)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/flows/${selectedFlowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flowName,
          description: flowDescription,
          isActive: true,
          nodes: nodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: node.data,
          })),
          edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            label: edge.label,
          })),
        }),
      })

      if (response.ok) {
        setIsDirty(false)
        alert('Flujo guardado exitosamente')
        // Reload to get database IDs
        await loadFlow()
      } else {
        const errorData = await response.json()
        alert(`Error al guardar el flujo: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving flow:', error)
      alert('Error al guardar el flujo')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFlow = async () => {
    if (!selectedFlowId) return
    if (!confirm('¿Estás seguro de eliminar este flujo?')) return

    try {
      const response = await fetch(`/api/admin/flows/${selectedFlowId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchFlows()
        resetFlow()
        alert('Flujo eliminado')
      }
    } catch (error) {
      console.error('Error deleting flow:', error)
      alert('Error al eliminar el flujo')
    }
  }

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const position = project({
        x: event.clientX - 100,
        y: event.clientY - 50,
      })

      addNode(type, position)
    },
    [project, addNode]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/tenants" className="text-blue-600 hover:text-blue-800">
              ← Volver
            </Link>
            <h1 className="text-2xl font-bold">Editor de Flujos</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Tenant Selector */}
            <select
              value={selectedTenantId || ''}
              onChange={(e) => {
                setSelectedTenant(e.target.value)
                resetFlow()
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar Tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>

            {/* Flow Selector */}
            {selectedTenantId && (
              <>
                <select
                  value={selectedFlowId || ''}
                  onChange={(e) => setSelectedFlow(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg min-w-[200px]"
                >
                  <option value="">Nuevo Flujo</option>
                  {flows.map((flow) => (
                    <option key={flow.id} value={flow.id}>
                      {flow.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowNewFlowDialog(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Nuevo
                </button>
              </>
            )}

            {selectedFlowId && (
              <>
                <button
                  onClick={handleSaveFlow}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Guardando...' : isDirty ? 'Guardar Cambios' : 'Guardar'}
                </button>

                <button
                  onClick={handleDeleteFlow}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {selectedFlowId && (
          <div className="mt-3 flex items-center gap-3">
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm flex-1"
              placeholder="Nombre del flujo"
            />
            <input
              type="text"
              value={flowDescription}
              onChange={(e) => setFlowDescription(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm flex-1"
              placeholder="Descripción (opcional)"
            />
          </div>
        )}

        {selectedFlowId && (
          <div className="mt-2 text-sm">
            {isDirty ? (
              <span className="text-orange-600">⚠️ Hay cambios sin guardar</span>
            ) : (
              <span className="text-green-600">✓ Todo guardado</span>
            )}
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        <NodePalette
          onDragStart={(e, nodeType) => {
            e.dataTransfer.setData('application/reactflow', nodeType)
            e.dataTransfer.effectAllowed = 'move'
          }}
        />

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          {selectedTenantId ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">Selecciona un tenant para comenzar</p>
                <p className="text-sm">Usa el selector en la parte superior</p>
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        <PropertiesPanel />
      </div>

      {/* New Flow Dialog */}
      {showNewFlowDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Crear Nuevo Flujo</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Flujo
                </label>
                <input
                  type="text"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Atención al Cliente"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newFlowDescription}
                  onChange={(e) => setNewFlowDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Describe el propósito de este flujo"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewFlowDialog(false)
                  setNewFlowName('')
                  setNewFlowDescription('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFlow}
                disabled={!newFlowName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Crear Flujo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FlowEditorPage() {
  return (
    <ReactFlowProvider>
      <FlowEditorContent />
    </ReactFlowProvider>
  )
}

function getDefaultLabel(nodeType: string): string {
  switch (nodeType) {
    case 'text':
      return 'Mensaje de Texto'
    case 'menu':
      return 'Menú (Lista)'
    case 'buttons':
      return 'Botones'
    case 'capture_data':
      return 'Capturar Datos'
    case 'condition':
      return 'Condición'
    case 'ai':
      return 'Respuesta AI'
    default:
      return 'Nodo'
  }
}

function validateFlow(nodes: any[], edges: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if flow has nodes
  if (nodes.length === 0) {
    errors.push('El flujo debe tener al menos un nodo')
    return { valid: false, errors }
  }

  // Check if there's at least one root node
  const nodesWithIncoming = new Set(edges.map(e => e.target))
  const rootNodes = nodes.filter(n => !nodesWithIncoming.has(n.id))

  if (rootNodes.length === 0) {
    errors.push('El flujo debe tener un nodo inicial (sin conexiones entrantes)')
  }

  if (rootNodes.length > 1) {
    errors.push('El flujo tiene múltiples nodos iniciales. Solo debe haber uno.')
  }

  // Validate menu options
  nodes.forEach(node => {
    if (node.type === 'menu') {
      const options = node.data.config?.options || []
      if (options.length === 0) {
        errors.push(`Menú "${node.data.label}" no tiene opciones`)
      }
      if (options.length > 10) {
        errors.push(`Menú "${node.data.label}" tiene más de 10 opciones (máx permitido por WhatsApp)`)
      }
    }

    if (node.type === 'buttons') {
      const buttons = node.data.config?.buttons || []
      if (buttons.length === 0) {
        errors.push(`Botones "${node.data.label}" no tiene botones`)
      }
      if (buttons.length > 3) {
        errors.push(`Botones "${node.data.label}" tiene más de 3 botones (máx permitido por WhatsApp)`)
      }
    }

    if (node.type === 'text') {
      const text = node.data.config?.text || ''
      if (!text.trim()) {
        errors.push(`Mensaje de texto "${node.data.label}" está vacío`)
      }
    }
  })

  return { valid: errors.length === 0, errors }
}
