import React, { useState } from 'react'
import { IForm, IFormField, ISubmissionResponse } from '../types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../lib/utils'
import api from '../lib/api'

interface FormPreviewProps {
  form?: IForm | null
  fields?: IFormField[]
  title?: string
  description?: string
  onSubmit?: (responses: ISubmissionResponse[]) => void
  isSubmitting?: boolean
  showSubmitButton?: boolean
  className?: string
}

const FormPreview: React.FC<FormPreviewProps> = ({
  form,
  fields,
  title,
  description,
  onSubmit,
  isSubmitting = false,
  showSubmitButton = true,
  className
}) => {
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Use form data if provided, otherwise use individual props
  const formTitle = form?.title || title || 'Untitled Form'
  const formDescription = form?.description || description
  const formFields = form?.fields || fields || []

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }))
    }
  }

  const validateField = (field: IFormField, value: any): string => {
    const validation = field.validation

    // Required field validation
    if (validation.required) {
      if (!value || (Array.isArray(value) && value.length === 0) || value.toString().trim() === '') {
        return `${field.label} is required`
      }
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return ''
    }

    // String length validations
    if (validation.minLength && value.toString().length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`
    }

    if (validation.maxLength && value.toString().length > validation.maxLength) {
      return `${field.label} must not exceed ${validation.maxLength} characters`
    }

    // Number validations
    if (field.type === 'number') {
      const numValue = parseFloat(value)
      if (isNaN(numValue)) {
        return `${field.label} must be a valid number`
      }

      if (validation.min !== undefined && numValue < validation.min) {
        return `${field.label} must be at least ${validation.min}`
      }

      if (validation.max !== undefined && numValue > validation.max) {
        return `${field.label} must not exceed ${validation.max}`
      }
    }

    // Email validation
    if (field.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value)) {
        return `Please enter a valid email address`
      }
    }

    // Pattern validation
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        return `${field.label} format is invalid`
      }
    }

    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const newErrors: Record<string, string> = {}
    formFields.forEach(field => {
      const error = validateField(field, responses[field.id])
      if (error) {
        newErrors[field.id] = error
      }
    })

    setErrors(newErrors)

    // If there are validation errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      return
    }

    // Prepare submission responses
    const submissionResponses: ISubmissionResponse[] = formFields.map(field => ({
      fieldId: field.id,
      value: responses[field.id] || (field.type === 'checkbox' ? [] : ''),
    }))

    if (onSubmit) {
      onSubmit(submissionResponses)
    } else if (form?._id) {
      // Default submission behavior if no custom onSubmit handler
      setIsLoading(true)
      try {
        await api.post(`/submissions`, {
          formId: form._id,
          responses: submissionResponses
        })
        alert('Form submitted successfully!')
        setResponses({}) // Reset form
      } catch (error: any) {
        console.error('Error submitting form:', error)
        alert(error.response?.data?.message || 'Error submitting form')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const renderField = (field: IFormField) => {
    const baseClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-blue-400"
    const errorClasses = errors[field.id] ? "border-red-500 focus:ring-red-500" : ""
    const inputClasses = cn(baseClasses, errorClasses)

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className={inputClasses}
          />
        )

      case 'email':
        return (
          <Input
            type="email"
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || "Enter email address"}
            className={inputClasses}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || "Enter number"}
            className={inputClasses}
            min={field.validation.min}
            max={field.validation.max}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className={cn(inputClasses, "resize-vertical min-h-[100px]")}
            rows={4}
            minLength={field.validation.minLength}
            maxLength={field.validation.maxLength}
          />
        )

      case 'select':
        return (
          <select
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={inputClasses}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(responses[field.id] || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = responses[field.id] || []
                    let newValues
                    if (e.target.checked) {
                      newValues = [...currentValues, option.value]
                    } else {
                      newValues = currentValues.filter((val: string) => val !== option.value)
                    }
                    handleInputChange(field.id, newValues)
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                  id={`checkbox-${field.id}-${idx}`}
                />
                <label htmlFor={`checkbox-${field.id}-${idx}`} className="text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`radio-${field.id}`}
                  value={option.value}
                  checked={responses[field.id] === option.value}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                  id={`radio-${field.id}-${idx}`}
                />
                <label htmlFor={`radio-${field.id}-${idx}`} className="text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )

      case 'file':
        return (
          <div className="relative">
            <input
              type="file"
              onChange={(e) => handleInputChange(field.id, e.target.files?.[0])}
              className="hidden"
              id={`file-${field.id}`}
              accept={field.validation.fileTypes?.join(',') || '*'}
              multiple={field.validation.maxFiles !== 1}
            />
            <label
              htmlFor={`file-${field.id}`}
              className={cn(
                "flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors",
                errors[field.id] ? "border-red-500" : "border-gray-300 bg-white"
              )}
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                </p>
                {field.validation.fileTypes && field.validation.fileTypes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Allowed: {field.validation.fileTypes.join(', ')}
                  </p>
                )}
                {field.validation.maxFileSize && (
                  <p className="text-xs text-gray-500">Max size: {field.validation.maxFileSize}MB</p>
                )}
                {responses[field.id] && (
                  <p className="text-xs text-green-600 mt-2">
                    Selected: {responses[field.id].name || responses[field.id]}
                  </p>
                )}
              </div>
            </label>
          </div>
        )

      case 'date':
        return (
          <Input
            type="date"
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={inputClasses}
          />
        )

      default:
        return (
          <Input
            type="text"
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || field.label}
            className={inputClasses}
          />
        )
    }
  }

  return (
    <div className={cn("bg-card border border-border rounded-lg p-6", className)}>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">{formTitle}</h3>
          {formDescription && (
            <p className="text-muted-foreground">{formDescription}</p>
          )}
        </div>

        <div className="space-y-6">
          {formFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.validation.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {renderField(field)}
              
              {errors[field.id] && (
                <p className="text-red-500 text-xs mt-1">{errors[field.id]}</p>
              )}
              
              {field.helpText && (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
              )}
            </div>
          ))}
        </div>

        {showSubmitButton && (
          <div className="mt-8">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}

export default FormPreview
