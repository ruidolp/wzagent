import { create } from 'zustand'
import type { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow'

export interface FlowNode extends Node {
  data: {
    label: string
    config: Record<string, any>
    transitions?: Record<string, any>
  }
}

interface FlowEditorStore {
  nodes: FlowNode[]
  edges: Edge[]
  selectedNode: FlowNode | null
  selectedTenantId: string | null
  selectedFlowId: string | null
  flowName: string
  flowDescription: string
  isDirty: boolean

  setNodes: (nodes: FlowNode[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: string, position: { x: number; y: number }) => void
  selectNode: (nodeId: string | null) => void
  updateNodeConfig: (nodeId: string, config: Record<string, any>) => void
  deleteNode: (nodeId: string) => void
  setSelectedTenant: (tenantId: string | null) => void
  setSelectedFlow: (flowId: string | null) => void
  setFlowName: (name: string) => void
  setFlowDescription: (description: string) => void
  resetFlow: () => void
  setIsDirty: (isDirty: boolean) => void
}

let nodeIdCounter = 0

export const useFlowEditorStore = create<FlowEditorStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedTenantId: null,
  selectedFlowId: null,
  flowName: '',
  flowDescription: '',
  isDirty: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    const { applyNodeChanges } = require('reactflow')
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    })
  },

  onEdgesChange: (changes) => {
    const { applyEdgeChanges } = require('reactflow')
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    })
  },

  onConnect: (connection) => {
    const { addEdge } = require('reactflow')
    set({
      edges: addEdge(connection, get().edges),
      isDirty: true,
    })
  },

  addNode: (type, position) => {
    const id = `node_${++nodeIdCounter}_${Date.now()}`

    const newNode: FlowNode = {
      id,
      type,
      position,
      data: {
        label: getDefaultLabel(type),
        config: getDefaultConfig(type),
      },
    }

    set({
      nodes: [...get().nodes, newNode],
      isDirty: true,
    })
  },

  selectNode: (nodeId) => {
    const node = nodeId ? get().nodes.find((n) => n.id === nodeId) : null
    set({ selectedNode: node || null })
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      ),
      isDirty: true,
    })
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNode: null,
      isDirty: true,
    })
  },

  setSelectedTenant: (tenantId) => set({ selectedTenantId: tenantId }),
  setSelectedFlow: (flowId) => set({ selectedFlowId: flowId }),
  setFlowName: (name) => set({ flowName: name, isDirty: true }),
  setFlowDescription: (description) => set({ flowDescription: description, isDirty: true }),

  resetFlow: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedFlowId: null,
    flowName: '',
    flowDescription: '',
    isDirty: false,
  }),

  setIsDirty: (isDirty) => set({ isDirty }),
}))

function getDefaultLabel(type: string): string {
  switch (type) {
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

function getDefaultConfig(type: string): Record<string, any> {
  switch (type) {
    case 'text':
      return { text: 'Escribe tu mensaje aquí' }
    case 'menu':
      return {
        header: 'Selecciona una opción',
        body: '¿Qué necesitas?',
        buttonText: 'Ver opciones',
        options: [],
      }
    case 'buttons':
      return {
        body: '¿Qué deseas hacer?',
        buttons: [],
      }
    case 'capture_data':
      return {
        field: 'data',
        prompt: 'Por favor ingresa el dato',
        validation: 'none',
        saveToUser: false,
      }
    case 'condition':
      return {
        field: 'variable',
        operator: 'equals',
        value: '',
      }
    case 'ai':
      return {
        prompt: 'Responde de manera útil y amigable',
        maxTokens: 150,
      }
    default:
      return {}
  }
}
