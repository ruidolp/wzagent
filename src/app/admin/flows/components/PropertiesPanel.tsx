import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useFlowEditorStore } from '../store'

export default function PropertiesPanel() {
  const { selectedNode, updateNodeConfig, deleteNode, selectNode } = useFlowEditorStore()
  const [config, setConfig] = useState<Record<string, any>>({})

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data.config || {})
    }
  }, [selectedNode])

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 mt-8">
          <p className="text-sm">Selecciona un nodo para ver sus propiedades</p>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    updateNodeConfig(selectedNode.id, config)
    // Force re-render to update handles
    selectNode(selectedNode.id)
  }

  const handleDelete = () => {
    if (confirm('¿Estás seguro de eliminar este nodo?')) {
      deleteNode(selectedNode.id)
    }
  }

  const handleClose = () => {
    selectNode(null)
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-bold text-lg">Propiedades</h3>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Tipo de Nodo</div>
          <div className="font-semibold text-sm">{selectedNode.data.label}</div>
        </div>

        {renderConfigFields(selectedNode.type, config, setConfig)}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={handleSave}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Guardar Cambios
        </button>
        <button
          onClick={handleDelete}
          className="w-full py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          Eliminar Nodo
        </button>
      </div>
    </div>
  )
}

function renderConfigFields(
  nodeType: string | undefined,
  config: Record<string, any>,
  setConfig: (config: Record<string, any>) => void
) {
  const updateField = (field: string, value: any) => {
    setConfig({ ...config, [field]: value })
  }

  switch (nodeType) {
    case 'text':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje
            </label>
            <textarea
              value={config.text || ''}
              onChange={(e) => updateField('text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Escribe tu mensaje aquí..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Variables: {'{nombre}'}, {'{phone}'}
            </p>
          </div>
        </div>
      )

    case 'menu':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Encabezado (opcional)
            </label>
            <input
              type="text"
              value={config.header || ''}
              onChange={(e) => updateField('header', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Título del menú"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuerpo del Mensaje
            </label>
            <textarea
              value={config.body || ''}
              onChange={(e) => updateField('body', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="¿Qué necesitas?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto del Botón
            </label>
            <input
              type="text"
              value={config.buttonText || ''}
              onChange={(e) => updateField('buttonText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ver opciones"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opciones (máx 10)
            </label>
            <MenuOptionsEditor
              options={config.options || []}
              onChange={(options) => updateField('options', options)}
            />
          </div>
        </div>
      )

    case 'buttons':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje
            </label>
            <textarea
              value={config.body || ''}
              onChange={(e) => updateField('body', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="¿Qué deseas hacer?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Botones (máx 3)
            </label>
            <ButtonsEditor
              buttons={config.buttons || []}
              onChange={(buttons) => updateField('buttons', buttons)}
            />
          </div>
        </div>
      )

    case 'capture_data':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campo a Capturar
            </label>
            <input
              type="text"
              value={config.field || ''}
              onChange={(e) => updateField('field', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="email, nombre, edad, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pregunta
            </label>
            <textarea
              value={config.prompt || ''}
              onChange={(e) => updateField('prompt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
              placeholder="Por favor ingresa tu email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validación
            </label>
            <select
              value={config.validation || 'none'}
              onChange={(e) => updateField('validation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="none">Sin validación</option>
              <option value="email">Email</option>
              <option value="phone">Teléfono</option>
              <option value="number">Número</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="saveToUser"
              checked={config.saveToUser || false}
              onChange={(e) => updateField('saveToUser', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="saveToUser" className="text-sm text-gray-700">
              Guardar en perfil de usuario
            </label>
          </div>
        </div>
      )

    case 'condition':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variable
            </label>
            <input
              type="text"
              value={config.field || ''}
              onChange={(e) => updateField('field', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="nombre_variable"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operador
            </label>
            <select
              value={config.operator || 'equals'}
              onChange={(e) => updateField('operator', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="equals">Igual a</option>
              <option value="not_equals">Diferente de</option>
              <option value="contains">Contiene</option>
              <option value="greater_than">Mayor que</option>
              <option value="less_than">Menor que</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor
            </label>
            <input
              type="text"
              value={config.value || ''}
              onChange={(e) => updateField('value', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="valor a comparar"
            />
          </div>
        </div>
      )

    case 'ai':
      return (
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Funcionalidad AI próximamente. El nodo está disponible para planificar flujos.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt del Sistema
            </label>
            <textarea
              value={config.prompt || ''}
              onChange={(e) => updateField('prompt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Responde de manera útil y amigable..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tokens Máximos
            </label>
            <input
              type="number"
              value={config.maxTokens || 150}
              onChange={(e) => updateField('maxTokens', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="50"
              max="1000"
            />
          </div>
        </div>
      )

    default:
      return <div className="text-sm text-gray-500">No hay configuración disponible</div>
  }
}

function MenuOptionsEditor({ options, onChange }: { options: any[]; onChange: (options: any[]) => void }) {
  const addOption = () => {
    if (options.length >= 10) {
      alert('Máximo 10 opciones permitidas')
      return
    }
    onChange([...options, { id: `opt_${Date.now()}`, title: '', description: '' }])
  }

  const updateOption = (index: number, field: string, value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    onChange(newOptions)
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Opción {index + 1}</span>
            <button
              onClick={() => removeOption(index)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={option.title || ''}
            onChange={(e) => updateOption(index, 'title', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="Título"
          />
          <input
            type="text"
            value={option.description || ''}
            onChange={(e) => updateOption(index, 'description', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="Descripción (opcional)"
          />
        </div>
      ))}
      <button
        onClick={addOption}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
      >
        + Agregar Opción
      </button>
    </div>
  )
}

function ButtonsEditor({ buttons, onChange }: { buttons: any[]; onChange: (buttons: any[]) => void }) {
  const addButton = () => {
    if (buttons.length >= 3) {
      alert('Máximo 3 botones permitidos')
      return
    }
    onChange([...buttons, { id: `btn_${Date.now()}`, title: '' }])
  }

  const updateButton = (index: number, value: string) => {
    const newButtons = [...buttons]
    newButtons[index] = { ...newButtons[index], title: value }
    onChange(newButtons)
  }

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {buttons.map((button, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={button.title || ''}
            onChange={(e) => updateButton(index, e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            placeholder={`Botón ${index + 1}`}
          />
          <button
            onClick={() => removeButton(index)}
            className="text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={addButton}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
      >
        + Agregar Botón
      </button>
    </div>
  )
}
