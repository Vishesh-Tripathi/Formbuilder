import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { IForm, ISubmissionResponse } from '../types'
import api from '../lib/api'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import PublicFormRenderer from '../components/PublicFormRenderer'

interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'error'
  message?: string
  redirectUrl?: string
}

const PublicForm: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<IForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submission, setSubmission] = useState<SubmissionState>({
    status: 'idle'
  })
  const [currentStep, setCurrentStep] = useState(0)

  // Check if form is multi-step based on field groups or step indicators
  const isMultiStep = form?.fields?.some(field => field.step !== undefined) || false
  const totalSteps = isMultiStep 
    ? Math.max(...(form?.fields?.map(field => field.step || 0) || [0])) + 1 
    : 1

  useEffect(() => {
    if (slug) {
      fetchPublicForm()
    }
  }, [slug])

  const fetchPublicForm = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/forms/public/${slug}`)
      
      if (response.data.success) {
        setForm(response.data.data.form)
        
        // Check if form has submission limit
        if (response.data.data.form.settings?.submissionLimit) {
          const { submissionCount, settings } = response.data.data.form
          if (submissionCount >= settings.submissionLimit) {
            setError('This form has reached its submission limit and is no longer accepting responses.')
            return
          }
        }
      } else {
        setError('Form not found or not publicly accessible')
      }
    } catch (error: any) {
      console.error('Error fetching public form:', error)
      setError(error?.response?.data?.error || 'Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (responses: ISubmissionResponse[]) => {
    if (!form) return

    setSubmission({ status: 'submitting' })

    try {
      const submitterEmail = searchParams.get('email') || undefined
      const response = await api.post(`/submissions/${form._id}`, {
        responses,
        submitterEmail
      })

      if (response.data.success) {
        const successMessage = form.settings?.thankYouMessage || response.data.message || 'Thank you for your submission!'
        const redirectUrl = form.settings?.redirectUrl
        
        setSubmission({
          status: 'success',
          message: successMessage,
          redirectUrl
        })

        // Handle redirect if specified
        if (redirectUrl && form.settings?.redirectDelay !== false) {
          const delay = form.settings?.redirectDelay || 3000
          setTimeout(() => {
            window.location.href = redirectUrl
          }, delay)
        }
      }
    } catch (error: any) {
      console.error('Error submitting form:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'An error occurred while submitting the form. Please try again.'
      
      setSubmission({
        status: 'error',
        message: errorMessage
      })
    }
  }

  const handleStepNavigation = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else if (direction === 'prev' && currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetForm = () => {
    setSubmission({ status: 'idle' })
    setCurrentStep(0)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Available</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={fetchPublicForm}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (submission.status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 mb-6">{submission.message}</p>
            
            {submission.redirectUrl && (
              <div className="mb-4">
                <Alert>
                  <AlertDescription>
                    You will be redirected automatically, or{' '}
                    <a 
                      href={submission.redirectUrl} 
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      click here to continue
                    </a>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={resetForm}
                variant="outline"
                className="flex-1"
              >
                Submit Another
              </Button>
              {submission.redirectUrl && (
                <Button 
                  onClick={() => window.location.href = submission.redirectUrl!}
                  className="flex-1"
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
              {form.description && (
                <p className="text-gray-600 mt-2">{form.description}</p>
              )}
            </div>
            {/* Progress indicator for multi-step forms */}
            {isMultiStep && totalSteps > 1 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {submission.status === 'error' && (
            <div className="p-6 border-b bg-red-50">
              <Alert className="border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {submission.message}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <PublicFormRenderer
            form={form}
            onSubmit={handleSubmit}
            isSubmitting={submission.status === 'submitting'}
            currentStep={isMultiStep ? currentStep : undefined}
            onStepChange={isMultiStep ? handleStepNavigation : undefined}
            totalSteps={isMultiStep ? totalSteps : undefined}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This form is powered by FormBuilder
            {form.settings?.showPoweredBy !== false && (
              <span> • Secure & Private</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PublicForm
