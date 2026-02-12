import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { MessageSquare, List, MousePointerClick, Database, GitBranch, Sparkles } from 'lucide-react'
import type { NodeProps } from 'reactflow'

const nodeIcons = {
  text: MessageSquare,
  menu: List,
  buttons: MousePointerClick,
  capture_data: Database,
  condition: GitBranch,
  ai: Sparkles,
}

const nodeColors = {
  text: 'bg-blue-500',
  menu: 'bg-purple-500',
  buttons: 'bg-green-500',
  capture_data: 'bg-orange-500',
  condition: 'bg-yellow-500',
  ai: 'bg-pink-500',
}

function CustomNode({ data, type, selected, id }: NodeProps) {
  const Icon = nodeIcons[type as keyof typeof nodeIcons] || MessageSquare
  const color = nodeColors[type as keyof typeof nodeColors] || 'bg-gray-500'

  // Get options/buttons for menu and button nodes
  const options = data.config?.options || []
  const buttons = data.config?.buttons || []
  const hasMultipleHandles = (type === 'menu' && options.length > 0) || (type === 'buttons' && buttons.length > 0)

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 ${
        selected ? 'border-blue-600' : 'border-gray-300'
      } bg-white min-w-[200px] max-w-[280px]`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded ${color} text-white flex-shrink-0`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-800 truncate">
            {data.label}
          </div>
          {data.config?.text && (
            <div className="text-xs text-gray-500 truncate mt-1">
              {data.config.text.substring(0, 50)}
              {data.config.text.length > 50 ? '...' : ''}
            </div>
          )}
          {data.config?.body && (
            <div className="text-xs text-gray-500 truncate mt-1">
              {data.config.body.substring(0, 50)}
              {data.config.body.length > 50 ? '...' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Show options/buttons in the node */}
      {type === 'menu' && options.length > 0 && (
        <div className="mt-2 space-y-1">
          {options.slice(0, 3).map((option: any, index: number) => (
            <div key={option.id} className="text-xs text-gray-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
              <span className="truncate">{option.title || 'Sin título'}</span>
            </div>
          ))}
          {options.length > 3 && (
            <div className="text-xs text-gray-400 italic">
              +{options.length - 3} más...
            </div>
          )}
        </div>
      )}

      {type === 'buttons' && buttons.length > 0 && (
        <div className="mt-2 space-y-1">
          {buttons.map((button: any) => (
            <div key={button.id} className="text-xs text-gray-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-green-400 rounded-full"></span>
              <span className="truncate">{button.title || 'Sin título'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Multiple handles for menu/buttons or single handle for others */}
      {hasMultipleHandles ? (
        <>
          {/* Menu options handles */}
          {type === 'menu' && options.map((option: any, index: number) => (
            <Handle
              key={option.id}
              type="source"
              position={Position.Right}
              id={option.id}
              style={{
                top: `${40 + (index * 20)}px`,
                background: '#9333ea',
              }}
              className="w-2 h-2"
            />
          ))}

          {/* Button handles */}
          {type === 'buttons' && buttons.map((button: any, index: number) => (
            <Handle
              key={button.id}
              type="source"
              position={Position.Right}
              id={button.id}
              style={{
                top: `${40 + (index * 20)}px`,
                background: '#22c55e',
              }}
              className="w-2 h-2"
            />
          ))}
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      )}
    </div>
  )
}

export default memo(CustomNode)
