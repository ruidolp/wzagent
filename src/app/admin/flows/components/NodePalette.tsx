import { MessageSquare, List, MousePointerClick, Database, GitBranch, Sparkles, CircleStop } from 'lucide-react'

interface NodeType {
  type: string
  label: string
  icon: any
  color: string
  description: string
  disabled?: boolean
}

const nodeTypes: NodeType[] = [
  {
    type: 'text',
    label: 'Mensaje de Texto',
    icon: MessageSquare,
    color: 'bg-blue-500',
    description: 'Envía un mensaje de texto simple',
  },
  {
    type: 'menu',
    label: 'Menú (Lista)',
    icon: List,
    color: 'bg-purple-500',
    description: 'Lista interactiva con hasta 10 opciones',
  },
  {
    type: 'buttons',
    label: 'Botones',
    icon: MousePointerClick,
    color: 'bg-green-500',
    description: 'Botones rápidos (máx 3)',
  },
  {
    type: 'capture_data',
    label: 'Capturar Datos',
    icon: Database,
    color: 'bg-orange-500',
    description: 'Solicita y guarda información del usuario',
  },
  {
    type: 'end',
    label: 'Fin de Flujo',
    icon: CircleStop,
    color: 'bg-red-500',
    description: 'Marca el final del flujo conversacional',
  },
  {
    type: 'condition',
    label: 'Condición',
    icon: GitBranch,
    color: 'bg-yellow-500',
    description: 'Bifurca el flujo según condiciones',
  },
  {
    type: 'ai',
    label: 'Respuesta AI',
    icon: Sparkles,
    color: 'bg-pink-500',
    description: 'Respuesta inteligente con IA (próximamente)',
    disabled: true,
  },
]

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void
}

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-bold text-lg mb-4 text-gray-800">Nodos Disponibles</h3>
      <p className="text-xs text-gray-500 mb-4">
        Arrastra un nodo al canvas para agregarlo
      </p>

      <div className="space-y-2">
        {nodeTypes.map((nodeType) => {
          const Icon = nodeType.icon
          return (
            <div
              key={nodeType.type}
              draggable={!nodeType.disabled}
              onDragStart={(e) => !nodeType.disabled && onDragStart(e, nodeType.type)}
              className={`
                p-3 rounded-lg border-2 border-gray-200 cursor-move
                hover:border-gray-400 hover:shadow-md transition-all
                ${nodeType.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-start gap-2">
                <div className={`p-2 rounded ${nodeType.color} text-white flex-shrink-0`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800">
                    {nodeType.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {nodeType.description}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-sm text-blue-800 mb-2">💡 Consejo</h4>
        <p className="text-xs text-blue-700">
          Conecta nodos arrastrando desde el punto inferior de un nodo al punto superior de otro.
        </p>
      </div>
    </div>
  )
}
