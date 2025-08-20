import React, { useState, useCallback } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { IFormField, FieldType, IFieldValidation, IFieldOption, IForm, IFormSettings } from '../types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import FormPreview from '../components/FormPreview'
import api from '../lib/api'
import { cn } from '../lib/utils'
import { Trash2, GripVertical, Save, Eye, Plus, Minus } from 'lucide-react'

const ItemTypes = {
  FIELD: 'field',
  EXISTING_FIELD: 'existingField',
}

interface DraggedField {
  type: FieldType
  label: string
}

interface DraggedExistingField {
  id: string
  index: number
}

// Field type configurations
const FIELD_TYPES: Array<{ type: FieldType; label: string; icon: string }> = [
  { type: 'text', label: 'Text Input', icon: '📝' },
  { type: 'email', label: 'Email', icon: '📧' },
  { type: 'select', label: 'Select Dropdown', icon: '📋' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'radio', label: 'Radio Button', icon: '🔘' },
  { type: 'textarea', label: 'Textarea', icon: '📄' },
  { type: 'file', label: 'File Upload', icon: '📎' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'date', label: 'Date', icon: '📅' }
]

// Draggable field type component
const DraggableFieldType: React.FC<{ field: typeof FIELD_TYPES[0] }> = ({ field }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FIELD,
    item: { type: field.type, label: field.label } as DraggedField,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={`p-3 border border-border rounded-md cursor-move hover:bg-accent transition-colors flex items-center gap-2 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <span>{field.icon}</span>
      <span>{field.label}</span>
    </div>
  )
}

// Draggable existing field component
const DraggableField: React.FC<{
  field: IFormField
  index: number
  onSelect: (field: IFormField) => void
  onDelete: (fieldId: string) => void
  isSelected: boolean
}> = ({ field, index, onSelect, onDelete, isSelected }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EXISTING_FIELD,
    item: { id: field.id, index } as DraggedExistingField,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const renderFieldPreview = () => {
    const baseClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-blue-400";
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {(() => {
          switch (field.type) {
            case 'text':
              return (
                <Input
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  type="text"
                  className={baseClasses}
                />
              );
            case 'email':
              return (
                <Input
                  placeholder={field.placeholder || "Enter email address"}
                  type="email"
                  className={baseClasses}
                />
              );
            case 'number':
              return (
                <Input
                  placeholder={field.placeholder || "Enter number"}
                  type="number"
                  className={baseClasses}
                />
              );
            case 'textarea':
              return (
                <textarea
                  className={cn(baseClasses, "resize-vertical min-h-[100px]")}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  rows={4}
                />
              );
            case 'select':
              return (
                <select className={baseClasses}>
                  <option value="">{field.placeholder || 'Select an option'}</option>
                  {field.options?.map((option, idx) => (
                    <option key={idx} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              );
            case 'checkbox':
              return (
                <div className="space-y-2">
                  {field.options?.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-600 focus:ring-blue-500"
                        id={`checkbox-${field.id}-${idx}`}
                      />
                      <label htmlFor={`checkbox-${field.id}-${idx}`} className="text-sm text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              );
            case 'radio':
              return (
                <div className="space-y-2">
                  {field.options?.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name={`radio-${field.id}`}
                        className="text-blue-600 focus:ring-blue-500"
                        id={`radio-${field.id}-${idx}`}
                      />
                      <label htmlFor={`radio-${field.id}-${idx}`} className="text-sm text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              );
            case 'file':
              return (
                <div className="relative">
                  <input
                    type="file"
                    className="hidden"
                    id={`preview-file-${field.id}`}
                  />
                  <label
                    htmlFor={`preview-file-${field.id}`}
                    className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white"
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Any file type</p>
                    </div>
                  </label>
                </div>
              );
            case 'date':
              return (
                <Input
                  type="date"
                  className={baseClasses}
                />
              );
            default:
              return (
                <Input
                  placeholder={field.placeholder || field.label}
                  type="text"
                  className={baseClasses}
                />
              );
          }
        })()}
      </div>
    );
  }

  return (
    <div
      ref={drag}
      className={`p-4 border rounded-lg mb-4 cursor-pointer transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'}`}
      onClick={() => onSelect(field)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move hover:text-gray-600" />
          <label className="font-medium text-sm text-gray-900">
            {field.label}
            {field.validation.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(field.id)
          }}
          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div>
        {renderFieldPreview()}
      </div>
      {field.helpText && <p className="text-xs text-gray-500 mt-2 italic">{field.helpText}</p>}
    </div>
  )
}

// Drop zone component
const DropZone: React.FC<{
  fields: IFormField[]
  onDrop: (item: DraggedField | DraggedExistingField, targetIndex?: number) => void
  onSelectField: (field: IFormField) => void
  onDeleteField: (fieldId: string) => void
  selectedFieldId?: string
}> = ({ fields, onDrop, onSelectField, onDeleteField, selectedFieldId }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: [ItemTypes.FIELD, ItemTypes.EXISTING_FIELD],
    drop: (item: DraggedField | DraggedExistingField) => {
      onDrop(item)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }))

  const isActive = isOver && canDrop

  return (
    <div
      ref={drop}
      className={`min-h-96 p-6 border-2 border-dashed rounded-lg transition-colors ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : canDrop
          ? 'border-gray-400 bg-gray-50'
          : 'border-gray-300 bg-white'
      }`}
    >
      {fields.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Drop fields here to build your form</p>
          <p className="text-sm text-gray-400">Drag field types from the sidebar to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <DraggableField
              key={field.id}
              field={field}
              index={index}
              onSelect={onSelectField}
              onDelete={onDeleteField}
              isSelected={selectedFieldId === field.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const FormBuilder: React.FC = () => {
  const [fields, setFields] = useState<IFormField[]>([])
  const [selectedField, setSelectedField] = useState<IFormField | null>(null)
  const [formSettings, setFormSettings] = useState<IFormSettings>({
    title: 'Untitled Form',
    description: '',
    thankYouMessage: 'Thank you for your submission!',
    allowAnonymous: true,
    isPublic: true,
    collectEmail: false,
    requireLogin: false,
  })
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Generate unique field ID
  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Create a new field from field type
  const createFieldFromType = (type: FieldType, label: string): IFormField => {
    const baseField: IFormField = {
      id: generateFieldId(),
      type,
      label: label,
      placeholder: '',
      helpText: '',
      validation: {
        required: false,
      },
      order: fields.length,
    }

    // Add default options for select, checkbox, and radio fields
    if (type === 'select' || type === 'checkbox' || type === 'radio') {
      baseField.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ]
    }

    return baseField
  }

  // Handle dropping fields
  const handleDrop = useCallback((item: DraggedField | DraggedExistingField, targetIndex?: number) => {
    if ('type' in item) {
      // New field from sidebar
      const newField = createFieldFromType(item.type, item.label)
      setFields((prev) => {
        const updated = [...prev, newField]
        return updated.map((field, index) => ({ ...field, order: index }))
      })
    } else {
      // Existing field reorder (implement if needed)
      console.log('Reordering field:', item)
    }
  }, [fields])

  // Handle field selection
  const handleSelectField = (field: IFormField) => {
    setSelectedField(field)
  }

  // Handle field deletion
  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => {
      const updated = prev.filter((field) => field.id !== fieldId)
      return updated.map((field, index) => ({ ...field, order: index }))
    })
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  // Update selected field
  const updateSelectedField = (updates: Partial<IFormField>) => {
    if (!selectedField) return

    const updatedField = { ...selectedField, ...updates }
    setSelectedField(updatedField)
    setFields((prev) =>
      prev.map((field) => (field.id === selectedField.id ? updatedField : field))
    )
  }

  // Save form
  const saveForm = async () => {
    setIsSaving(true)
    try {
      const formData: Partial<IForm> = {
        title: formSettings.title || 'Untitled Form',
        description: formSettings.description,
        fields: fields,
        settings: formSettings,
        status: 'draft',
        version: 1,
      }

      // Create new form
      const response = await api.post('/forms', formData)
      
      alert('Form saved successfully!')
      // Optionally redirect to the new form's edit page
      // navigate(`/forms/${response.data.data._id}/edit`)
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(error.response?.data?.message || 'Error saving form')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full bg-background">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{formSettings.title}</h1>
              <p className="text-sm text-muted-foreground">
                {fields.length} field{fields.length !== 1 ? 's' : ''} • New Form
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button size="sm" onClick={saveForm} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Form'}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex h-full">
          {/* Sidebar with field types */}
          {!isPreview && (
            <div className="w-80 border-r border-border p-4">
              <h2 className="font-medium mb-4">Field Types</h2>
              <div className="space-y-2">
                {FIELD_TYPES.map((field) => (
                  <DraggableFieldType key={field.type} field={field} />
                ))}
              </div>
            </div>
          )}
          
          {/* Form canvas */}
          <div className="flex-1 p-8">
            <div className="max-w-2xl mx-auto">
              {isPreview ? (
                <FormPreview
                  fields={fields}
                  title={formSettings.title}
                  description={formSettings.description}
                  showSubmitButton={true}
                />
              ) : (
                <DropZone
                  fields={fields}
                  onDrop={handleDrop}
                  onSelectField={handleSelectField}
                  onDeleteField={handleDeleteField}
                  selectedFieldId={selectedField?.id}
                />
              )}
            </div>
          </div>
          
          {/* Properties panel */}
          {!isPreview && (
            <div className="w-80 border-l border-border p-4">
              {selectedField ? (
                <div>
                  <h2 className="font-medium mb-4">Field Properties</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Label</label>
                      <Input
                        value={selectedField.label}
                        onChange={(e) => updateSelectedField({ label: e.target.value })}
                        placeholder="Field label"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Placeholder</label>
                      <Input
                        value={selectedField.placeholder || ''}
                        onChange={(e) => updateSelectedField({ placeholder: e.target.value })}
                        placeholder="Placeholder text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Help Text</label>
                      <Input
                        value={selectedField.helpText || ''}
                        onChange={(e) => updateSelectedField({ helpText: e.target.value })}
                        placeholder="Help text"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="required"
                        checked={selectedField.validation.required || false}
                        onChange={(e) =>
                          updateSelectedField({
                            validation: { ...selectedField.validation, required: e.target.checked },
                          })
                        }
                      />
                      <label htmlFor="required" className="text-sm">
                        Required field
                      </label>
                    </div>
                    
                    {/* Options for select, checkbox, radio */}
                    {['select', 'checkbox', 'radio'].includes(selectedField.type) && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Options</label>
                        {selectedField.options?.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <Input
                              value={option.label}
                              onChange={(e) => {
                                const newOptions = [...(selectedField.options || [])]
                                newOptions[index] = { ...option, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') }
                                updateSelectedField({ options: newOptions })
                              }}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newOptions = selectedField.options?.filter((_, i) => i !== index) || []
                                updateSelectedField({ options: newOptions })
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = [...(selectedField.options || [])]
                            newOptions.push({
                              value: `option${newOptions.length + 1}`,
                              label: `Option ${newOptions.length + 1}`,
                            })
                            updateSelectedField({ options: newOptions })
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="font-medium mb-4">Form Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Form Title</label>
                      <Input
                        value={formSettings.title}
                        onChange={(e) => setFormSettings((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Form title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        className="w-full p-2 border border-input rounded-md resize-none"
                        value={formSettings.description || ''}
                        onChange={(e) => setFormSettings((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Form description"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  )
}

export default FormBuilder
