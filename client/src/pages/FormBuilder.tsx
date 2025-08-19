import React from 'react'

const FormBuilder: React.FC = () => {
  return (
    <div className="h-full bg-background">
      <div className="border-b border-border p-4">
        <h1 className="text-xl font-semibold">Form Builder</h1>
      </div>
      <div className="flex h-full">
        {/* Sidebar with field types */}
        <div className="w-80 border-r border-border p-4">
          <h2 className="font-medium mb-4">Field Types</h2>
          <div className="space-y-2">
            {[
              { type: 'text', label: 'Text Input' },
              { type: 'email', label: 'Email' },
              { type: 'select', label: 'Select Dropdown' },
              { type: 'checkbox', label: 'Checkbox' },
              { type: 'radio', label: 'Radio Button' },
              { type: 'textarea', label: 'Textarea' },
              { type: 'file', label: 'File Upload' },
              { type: 'number', label: 'Number' },
              { type: 'date', label: 'Date' }
            ].map((field) => (
              <div
                key={field.type}
                className="p-3 border border-border rounded-md cursor-pointer hover:bg-accent transition-colors"
              >
                {field.label}
              </div>
            ))}
          </div>
        </div>
        
        {/* Form canvas */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6 min-h-96">
              <h3 className="text-lg font-medium mb-4">Form Preview</h3>
              <p className="text-muted-foreground">Drag fields from the sidebar to build your form</p>
            </div>
          </div>
        </div>
        
        {/* Properties panel */}
        <div className="w-80 border-l border-border p-4">
          <h2 className="font-medium mb-4">Field Properties</h2>
          <p className="text-muted-foreground text-sm">Select a field to edit its properties</p>
        </div>
      </div>
    </div>
  )
}

export default FormBuilder
