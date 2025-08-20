import React, { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import FormPreview from '../components/FormPreview'
import { IForm, ISubmissionResponse } from '../types'
import { normalizeFormDataForPreview } from '../lib/utils'
import api from '../lib/api'
import { Button } from '../components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const FormView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<IForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (id) {
      fetchForm()
    }
  }, [id])

  const fetchForm = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/forms/${id}?includeFields=true`)
      console.log('Fetched form:', response.data)
      if (response.data.success) {
        // Normalize the form data for FormPreview component
        const normalizedForm = normalizeFormDataForPreview(response.data.data.form)
        setForm(normalizedForm)
      } else {
        setError('Failed to fetch form')
      }
    } catch (error: any) {
      console.error('Error fetching form:', error)
      setError(error?.response?.data?.error || 'Failed to fetch form')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (responses: ISubmissionResponse[]) => {
    if (!form) return

    setSubmitting(true)
    try {
      await api.post(`/submissions/${form._id}`, {
        responses: responses
      })
      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting form:', error)
      alert(error.response?.data?.message || 'Error submitting form')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus: 'draft' | 'published' | 'archived') => {
    if (!form) return

    setUpdatingStatus(true)
    try {
      const response = await api.patch(`/forms/${form._id}/status`, {
        status: newStatus
      })
      
      if (response.data.success) {
        // Update the form state with the new status
        setForm(prev => prev ? { ...prev, status: newStatus } : null)
        alert(`Form ${newStatus} successfully!`)
      } else {
        alert('Failed to update form status')
      }
    } catch (error: any) {
      console.error('Error updating form status:', error)
      alert(error.response?.data?.error || 'Failed to update form status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Redirect to dashboard if no id provided
  if (!id) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchForm}>Try Again</Button>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Form not found</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground">
              {form.settings?.thankYouMessage || 'Your form has been submitted successfully.'}
            </p>
            
            {/* Display submission details if available */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Submission received at: {new Date().toLocaleString()}
              </p>
              {form.settings?.redirectUrl && (
                <p className="text-sm text-blue-600 mt-2">
                  You will be redirected to: {form.settings.redirectUrl}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-x-4">
            <Button onClick={() => setSubmitted(false)}>Submit Another Response</Button>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            {form.settings?.redirectUrl && (
              <Button 
                onClick={() => window.location.href = form.settings.redirectUrl!}
                variant="outline"
              >
                Continue to Next Page
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{form.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  Status: 
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    form.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : form.status === 'draft' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {form.status}
                  </span>
                </span>
                <span>{form.submissionCount} submissions</span>
                <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to={`/analytics/${form._id}`}>
              <Button variant="outline" size="sm">
                Analytics
              </Button>
            </Link>
            <Link to={`/forms/${form._id}/edit`}>
              <Button variant="outline" size="sm">
                Edit Form
              </Button>
            </Link>
            
            {/* Status Change Buttons */}
            {form.status === 'draft' ? (
              <Button 
                size="sm"
                onClick={() => handleStatusChange('published')}
                disabled={updatingStatus}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {updatingStatus ? 'Publishing...' : 'Publish Form'}
              </Button>
            ) : form.status === 'published' ? (
              <div className="flex gap-1">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('draft')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : 'Unpublish'}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('archived')}
                  disabled={updatingStatus}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  {updatingStatus ? 'Archiving...' : 'Archive'}
                </Button>
              </div>
            ) : form.status === 'archived' ? (
              <div className="flex gap-1">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('draft')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : 'Move to Draft'}
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleStatusChange('published')}
                  disabled={updatingStatus}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updatingStatus ? 'Publishing...' : 'Publish'}
                </Button>
              </div>
            ) : null}
            
            {form.status === 'published' && form.slug && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Open public form in new tab
                  const publicUrl = `${window.location.origin}/public/${form.slug}`
                  window.open(publicUrl, '_blank')
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public
              </Button>
            )}
          </div>
        </div>

        {/* Form Preview */}
        <div className="max-w-2xl mx-auto">
          <FormPreview
            form={form}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            showSubmitButton={true}
          />
        </div>
      </div>
    </div>
  )
}

export default FormView
