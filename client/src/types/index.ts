// Field Configuration Types
export interface IFieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  fileTypes?: string[]
  maxFileSize?: number
}

export interface IFieldOption {
  value: string
  label: string
}

export type FieldType = 'text' | 'email' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file' | 'number' | 'date'

export interface IFormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  helpText?: string
  validation: IFieldValidation
  options?: IFieldOption[]
  order: number
}

// Form Settings Types
export interface IFormSettings {
  title: string
  description?: string
  thankYouMessage?: string
  submissionLimit?: number
  allowAnonymous?: boolean
  isPublic?: boolean
  collectEmail?: boolean
  requireLogin?: boolean
  customCSS?: string
}

// Form Types
export type FormStatus = 'draft' | 'published' | 'archived'

export interface IForm {
  _id: string
  title: string
  description?: string
  fields: IFormField[]
  settings: IFormSettings
  status: FormStatus
  createdBy?: string
  createdAt: string
  updatedAt: string
  submissionCount: number
  lastSubmittedAt?: string
  slug: string
  version: number
}

// Submission Types
export interface ISubmissionResponse {
  fieldId: string
  value: any
  files?: string[]
}

export interface ISubmission {
  _id: string
  formId: string
  responses: ISubmissionResponse[]
  submitterEmail?: string
  submitterIP?: string
  submitterUserAgent?: string
  metadata?: Record<string, any>
  submittedAt: string
  isAnonymous: boolean
}

// API Response Types
export interface IApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

export interface IPaginatedResponse<T = any> {
  success: boolean
  data: {
    items: T[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  error?: string
  message?: string
  timestamp?: string
}

// Analytics Types
export interface IFormAnalytics {
  overview: {
    totalSubmissions: number
    submissionsInPeriod: number
    completionRate: number
    averageCompletionTime?: number
    period: {
      start: string
      end: string
      label: string
    }
  }
  submissionsTrend: Array<{
    date: string
    count: number
  }>
  fieldAnalytics: Array<{
    fieldId: string
    fieldLabel: string
    fieldType: FieldType
    totalResponses: number
    uniqueResponseCount: number
    responseRate: number
    valueDistribution: Record<string, number>
    averageLength?: number
  }>
  responsePatterns: {
    hourlyDistribution: Array<{
      hour: number
      count: number
    }>
  }
  form: {
    title: string
    status: FormStatus
    createdAt: string
    lastSubmittedAt?: string
  }
}

// UI Component Types
export interface IDropdownOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ITableColumn<T = any> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, record: T) => React.ReactNode
}

// File Upload Types
export interface IUploadedFile {
  originalName: string
  filename: string
  path: string
  size: number
  mimetype: string
  url: string
}

export interface IFileUploadResponse {
  files: IUploadedFile[]
}

// Form Builder Types
export interface IDragItem {
  type: string
  fieldType: FieldType
  index?: number
}

export interface IDropResult {
  name: string
  allowedDropEffect?: string
}

// Error Types
export interface IValidationError {
  field: string
  message: string
  code?: string
}

export interface IApiError {
  message: string
  details?: IValidationError[]
  statusCode?: number
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// User Types (for future authentication)
export interface IUser {
  _id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}
