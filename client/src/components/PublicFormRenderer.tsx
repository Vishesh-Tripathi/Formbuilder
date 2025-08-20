import React, { useState, useRef } from 'react'
import { IForm, IFormField, ISubmissionResponse } from '../types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../lib/utils'
import { ArrowRight, ArrowLeft, Upload, FileText, Image, X } from 'lucide-react'
import { FormProgressWrapper } from './FormProgressWrapper'
import api from '../lib/api'

interface PublicFormRendererProps {
  form: IForm
  onSubmit: (responses: ISubmissionResponse[]) => void
  isSubmitting?: boolean
  currentStep?: number
  onStepChange?: (direction: 'next' | 'prev') => void
  totalSteps?: number
}

interface FileUploadState {
  [fieldId: string]: {
    files: File[]
    uploading: boolean
    uploadedFiles: any[]
    error?: string
  }
}

const PublicFormRenderer: React.FC<PublicFormRendererProps> = ({
  form,
  onSubmit,
  isSubmitting = false,
  currentStep = 0,
  onStepChange,
  totalSteps = 1
}) => {
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fileUploads, setFileUploads] = useState<FileUploadState>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Filter fields for current step
  const currentFields = form.fields?.filter(field => 
    totalSteps === 1 || !field.step || field.step === currentStep
  ) || []

  const isMultiStep = totalSteps > 1
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

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

  const handleFileUpload = async (fieldId: string, files: FileList) => {
    const field = form.fields?.find(f => f.id === fieldId)
    if (!field || !files.length) return

    // Validate file types and sizes
    const validFiles: File[] = []
    const maxSize = (field.validation.maxFileSize || 5) * 1024 * 1024 // Convert MB to bytes
    const allowedTypes = field.validation.fileTypes || []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Check file size
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          [fieldId]: `File "${file.name}" is too large. Maximum size is ${field.validation.maxFileSize || 5}MB`
        }))
        continue
      }

      // Check file type
      if (allowedTypes.length > 0) {
        const isAllowed = allowedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
          }
          return file.type === type || file.type.startsWith(type.replace('/*', '/'))
        })
        
        if (!isAllowed) {
          setErrors(prev => ({
            ...prev,
            [fieldId]: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
          }))
          continue
        }
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    // Set uploading state
    setFileUploads(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        files: validFiles,
        uploading: true,
        error: undefined
      }
    }))

    try {
      const formData = new FormData()
      validFiles.forEach(file => formData.append('files', file))

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const uploadedFiles = response.data.data.files
        
        setFileUploads(prev => ({
          ...prev,
          [fieldId]: {
            ...prev[fieldId],
            uploading: false,
            uploadedFiles
          }
        }))

        // Update form response with file URLs
        handleInputChange(fieldId, uploadedFiles.map((file: any) => file.url))
      }
    } catch (error: any) {
      console.error('File upload error:', error)
      setFileUploads(prev => ({
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          uploading: false,
          error: error.response?.data?.error || 'Upload failed. Please try again.'
        }
      }))
    }
  }

  const removeFile = async (fieldId: string, fileIndex: number) => {
    const uploadState = fileUploads[fieldId]
    if (!uploadState) return

    try {
      // Remove file from server if it was uploaded
      if (uploadState.uploadedFiles[fileIndex]) {
        const filename = uploadState.uploadedFiles[fileIndex].filename
        await api.delete(`/upload/${filename}`)
      }
    } catch (error) {
      console.error('Error removing file:', error)
    }

    // Update local state
    setFileUploads(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        files: prev[fieldId].files.filter((_, i) => i !== fileIndex),
        uploadedFiles: prev[fieldId].uploadedFiles.filter((_, i) => i !== fileIndex)
      }
    }))

    // Update form response
    const remainingFiles = uploadState.uploadedFiles
      .filter((_, i) => i !== fileIndex)
      .map(file => file.url)
    handleInputChange(fieldId, remainingFiles)
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

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    currentFields.forEach(field => {
      const error = validateField(field, responses[field.id])
      if (error) {
        newErrors[field.id] = error
      }
    })

    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep() && onStepChange) {
      onStepChange('next')
    }
  }

  const handlePrevious = () => {
    if (onStepChange) {
      onStepChange('prev')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For multi-step forms, validate all fields, not just current step
    const fieldsToValidate = isMultiStep ? form.fields : currentFields
    const newErrors: Record<string, string> = {}
    
    fieldsToValidate?.forEach(field => {
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
    const submissionResponses: ISubmissionResponse[] = (form.fields || []).map(field => ({
      fieldId: field.id,
      value: responses[field.id] || (field.type === 'checkbox' ? [] : ''),
      files: field.type === 'file' ? (fileUploads[field.id]?.uploadedFiles?.map(f => f.filename) || []) : undefined
    }))

    onSubmit(submissionResponses)
  }

  const renderField = (field: IFormField) => {
    const baseClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-400"
    const errorClasses = errors[field.id] ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""
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
            className={cn(inputClasses, "resize-vertical min-h-[120px]")}
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
          <div className="space-y-3">
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-3">
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
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  id={`checkbox-${field.id}-${idx}`}
                />
                <label htmlFor={`checkbox-${field.id}-${idx}`} className="text-gray-700 cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`radio-${field.id}`}
                  value={option.value}
                  checked={responses[field.id] === option.value}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="h-5 w-5 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  id={`radio-${field.id}-${idx}`}
                />
                <label htmlFor={`radio-${field.id}-${idx}`} className="text-gray-700 cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )

      case 'file':
        const uploadState = fileUploads[field.id] || { files: [], uploading: false, uploadedFiles: [] }
        return (
          <div className="space-y-4">
            <input
              type="file"
              multiple={field.validation.maxFiles !== 1}
              onChange={(e) => e.target.files && handleFileUpload(field.id, e.target.files)}
              className="hidden"
              id={`file-${field.id}`}
              ref={(el) => fileInputRefs.current[field.id] = el}
              accept={field.validation.fileTypes?.join(',') || '*'}
            />
            
            <div
              onClick={() => fileInputRefs.current[field.id]?.click()}
              className={cn(
                "flex items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200",
                errors[field.id] 
                  ? "border-red-300 bg-red-50 hover:bg-red-100" 
                  : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50"
              )}
            >
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                    Click to upload files
                  </span> or drag and drop
                </p>
                {field.validation.fileTypes && field.validation.fileTypes.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Allowed: {field.validation.fileTypes.join(', ')}
                  </p>
                )}
                {field.validation.maxFileSize && (
                  <p className="text-sm text-gray-500">
                    Max size: {field.validation.maxFileSize}MB per file
                  </p>
                )}
              </div>
            </div>

            {/* File list */}
            {(uploadState.files.length > 0 || uploadState.uploadedFiles.length > 0) && (
              <div className="space-y-2">
                {uploadState.files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadState.uploading && (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      )}
                      {!uploadState.uploading && (
                        <button
                          type="button"
                          onClick={() => removeFile(field.id, idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload error */}
            {uploadState.error && (
              <p className="text-sm text-red-600">{uploadState.error}</p>
            )}
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
    <FormProgressWrapper
      currentStep={currentStep}
      totalSteps={totalSteps}
      showProgressBar={isMultiStep && form.settings?.enableProgressBar !== false}
    >
      <div className="p-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {currentFields.map((field) => (
              <div key={field.id} className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  {field.label}
                  {field.validation.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {renderField(field)}
                
                {errors[field.id] && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4 text-red-500">⚠</span>
                    {errors[field.id]}
                  </p>
                )}
                
                {field.helpText && (
                  <p className="text-sm text-gray-500">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>

          {/* Form Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <div>
              {isMultiStep && !isFirstStep && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isMultiStep && !isLastStep ? (
                <Button 
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-3 font-semibold"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Submit Form'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </FormProgressWrapper>
  )
}

export default PublicFormRenderer
