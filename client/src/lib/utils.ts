import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { IForm, IFormField, IFormSettings } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes API response data to match the IForm interface expected by FormPreview component
 * @param apiData - Raw form data from API
 * @returns Normalized form data
 */
export function normalizeFormDataForPreview(apiData: any): IForm {
  // Ensure fields are properly structured
  const normalizedFields: IFormField[] = apiData.fields?.map((field: any) => ({
    id: field.id,
    type: field.type,
    label: field.label,
    placeholder: field.placeholder || '',
    helpText: field.helpText || '',
    validation: {
      required: field.validation?.required || false,
      minLength: field.validation?.minLength,
      maxLength: field.validation?.maxLength,
      pattern: field.validation?.pattern,
      min: field.validation?.min,
      max: field.validation?.max,
      fileTypes: field.validation?.fileTypes || [],
      maxFileSize: field.validation?.maxFileSize,
    },
    options: field.options || [],
    order: field.order || 0,
  })) || []

  // Sort fields by order to ensure correct display sequence
  normalizedFields.sort((a, b) => a.order - b.order)

  // Ensure settings are properly structured
  const normalizedSettings: IFormSettings = {
    title: apiData.settings?.title || apiData.title || 'Untitled Form',
    description: apiData.settings?.description || apiData.description || '',
    thankYouMessage: apiData.settings?.thankYouMessage || 'Thank you for your submission!',
    submissionLimit: apiData.settings?.submissionLimit,
    allowAnonymous: apiData.settings?.allowAnonymous !== undefined ? apiData.settings.allowAnonymous : true,
    isPublic: apiData.settings?.isPublic !== undefined ? apiData.settings.isPublic : true,
    collectEmail: apiData.settings?.collectEmail || false,
    requireLogin: apiData.settings?.requireLogin || false,
    customCSS: apiData.settings?.customCSS || '',
  }

  // Return normalized form data
  const normalizedForm: IForm = {
    _id: apiData._id || apiData.id,
    title: apiData.title || 'Untitled Form',
    description: apiData.description || '',
    fields: normalizedFields,
    settings: normalizedSettings,
    status: apiData.status || 'draft',
    createdBy: apiData.createdBy,
    createdAt: apiData.createdAt,
    updatedAt: apiData.updatedAt,
    submissionCount: apiData.submissionCount || 0,
    lastSubmittedAt: apiData.lastSubmittedAt,
    slug: apiData.slug || '',
    version: apiData.version || 1,
  }

  return normalizedForm
}

/**
 * Extracts and normalizes just the essential data needed for FormPreview
 * @param apiData - Raw form data from API
 * @returns Object with form, fields, title, and description for FormPreview
 */
export function prepareFormForPreview(apiData: any) {
  const normalizedForm = normalizeFormDataForPreview(apiData)
  
  return {
    form: normalizedForm,
    fields: normalizedForm.fields,
    title: normalizedForm.title,
    description: normalizedForm.description,
  }
}
