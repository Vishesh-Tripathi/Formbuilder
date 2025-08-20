import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ISubmission, IForm } from '../types'
import api from '../lib/api'
import { Button } from '../components/ui/button'
import { ArrowLeft, Eye, Calendar, Users, TrendingUp, Activity, X, BarChart3, FileText, Download } from 'lucide-react'

const Analytics: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [allForms, setAllForms] = useState<IForm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<ISubmission | null>(null)
  const [submissions, setSubmissions] = useState<{ [key: string]: ISubmission[] }>({})

  const isIndividualForm = !!id

  useEffect(() => {
    if (isIndividualForm) {
      fetchIndividualFormData()
    } else {
      fetchAllFormsData()
    }
  }, [id])

  const fetchAllFormsData = async () => {
    try {
      setLoading(true)
      console.log('Fetching all forms for analytics dashboard')
      
      const response = await api.get('/forms')
      if (response.data.success) {
        const forms = response.data.data.forms
        setAllForms(forms)
        
        // Fetch submissions for each form
        const submissionsMap: { [key: string]: ISubmission[] } = {}
        await Promise.all(
          forms.map(async (form: IForm) => {
            try {
              const subResponse = await api.get(`/submissions/${form._id}?page=1&limit=5`)
              console.log('Fetched submissions for form:', form._id, subResponse.data)
              console.log('Form status:', form.status, 'Form ID:', form._id)
              console.log('Total submissions found:', subResponse.data.data?.pagination?.total || 0)
              submissionsMap[form._id] = subResponse.data.success ? subResponse.data.data.submissions : []
            } catch (error) {
              console.error(`Error fetching submissions for ${form._id}:`, error)
              submissionsMap[form._id] = []
            }
          })
        )
        setSubmissions(submissionsMap)
      }
    } catch (error: any) {
      console.error('Error fetching forms:', error)
      setError('Failed to load forms data')
    } finally {
      setLoading(false)
    }
  }

  const fetchIndividualFormData = async () => {
    try {
      setLoading(true)
      console.log('Fetching individual form data for:', id)
      
      const [formResponse, submissionResponse] = await Promise.all([
        api.get(`/forms/${id}?includeFields=true`),
        api.get(`/submissions/${id}?page=1&limit=10`)
      ])

      if (formResponse.data.success) {
        setAllForms([formResponse.data.data.form])
      }

      if (submissionResponse.data.success) {
        setSubmissions({ [id!]: submissionResponse.data.data.submissions })
      }
    } catch (error: any) {
      console.error('Error fetching individual form data:', error)
      setError('Failed to load form data')
    } finally {
      setLoading(false)
    }
  }

  const handleViewSubmission = async (submissionId: string, formId: string) => {
    try {
      console.log('Attempting to view submission:', submissionId, 'for form:', formId)
      const response = await api.get(`/submissions/${formId}/${submissionId}`)
      console.log('Submission response:', response.data)
      if (response.data.success) {
        setSelectedSubmission(response.data.data.submission)
        console.log('Submission data set:', response.data.data.submission)
      } else {
        console.error('Failed to fetch submission:', response.data)
        alert('Failed to load submission details')
      }
    } catch (error: any) {
      console.error('Error fetching submission details:', error)
      alert('Failed to load submission details')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleExportCSV = async (formId: string, formTitle: string) => {
    try {
      console.log('Exporting CSV for form:', formId)
      
      // First, let's try a regular request to see if there are validation errors
      try {
        const testResponse = await api.get(`/submissions/${formId}/export`)
        console.log('Test response successful, now trying blob download...')
      } catch (testError: any) {
        console.error('Test request failed:', testError.response?.data)
        if (testError.response?.data?.error) {
          alert(`Export failed: ${testError.response.data.error}`)
          return
        }
      }
      
      // If test passed, do the actual blob request
      const response = await api.get(`/submissions/${formId}/export`, {
        responseType: 'blob'
      })
      
      // Create blob URL and download
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${formTitle.replace(/[^\w\s-]/g, '')}-submissions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error exporting CSV:', error)
      
      // Try to get the actual error message from the server
      if (error.response?.data) {
        try {
          // If the error response is a blob (which it might be due to responseType: 'blob')
          if (error.response.data instanceof Blob) {
            const text = await error.response.data.text()
            console.error('Server error response:', text)
            try {
              const errorData = JSON.parse(text)
              alert(`Export failed: ${errorData.error || errorData.message || 'Unknown error'}`)
            } catch {
              alert(`Export failed: ${text}`)
            }
          } else {
            console.error('Server error response:', error.response.data)
            alert(`Export failed: ${error.response.data.error || error.response.data.message || 'Server error'}`)
          }
        } catch (parseError) {
          console.error('Error parsing server response:', parseError)
          alert('Failed to export CSV. Please try again.')
        }
      } else {
        alert('Failed to export CSV. Please check your connection and try again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium mb-2">Error Loading Analytics</p>
            <p className="text-sm">{error}</p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="mr-2">
              Try Again
            </Button>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard view - showing all forms
  if (!isIndividualForm) {
    const totalForms = allForms.length
    const publishedForms = allForms.filter(f => f.status === 'published').length
    const totalSubmissions = Object.values(submissions).reduce((acc, subs) => acc + subs.length, 0)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Overview of all your forms and submissions</p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{totalForms}</div>
                <div className="text-sm text-muted-foreground">Total Forms</div>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{publishedForms}</div>
                <div className="text-sm text-muted-foreground">Published Forms</div>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{totalSubmissions}</div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{totalForms - publishedForms}</div>
                <div className="text-sm text-muted-foreground">Draft Forms</div>
              </div>
            </div>
          </div>
        </div>

        {/* All Forms with Submissions */}
        <div className="bg-card rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">All Forms & Recent Submissions</h3>
          </div>
          <div className="p-6">
            {allForms.length > 0 ? (
              <div className="space-y-6">
                {allForms.map((form) => (
                  <div key={form._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium">{form.title}</h4>
                        <div className="text-sm text-muted-foreground">
                          {form.submissionCount} submissions • Status: 
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                            form.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : form.status === 'draft' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {form.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/analytics/${form._id}`}>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Button>
                        </Link>
                        <Link to={`/forms/${form._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        {form.submissionCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('Export button clicked for form:', form._id, 'Title:', form.title)
                              handleExportCSV(form._id, form.title)
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Recent Submissions for this form */}
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-muted-foreground">Recent Submissions</h5>
                      {submissions[form._id] && submissions[form._id].length > 0 ? (
                        <div className="space-y-2">
                          {submissions[form._id].map((submission) => (
                            <div key={submission._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="text-sm">
                                <span className="font-medium">
                                  {formatDate(submission.submittedAt)}
                                </span>
                                {submission.submitterEmail && (
                                  <span className="text-muted-foreground ml-2">
                                    • {submission.submitterEmail}
                                  </span>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewSubmission(submission._id, form._id)}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No submissions yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No forms found
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Individual form analytics view
  const form = allForms[0]
  const formSubmissions = submissions[id!] || []

  console.log('Analytics render - selectedSubmission:', selectedSubmission, 'form:', form)

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/forms/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">{form?.title || 'Form Analytics'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {form && form.submissionCount > 0 && (
            <Button
              onClick={() => {
                console.log('Export button clicked for individual form:', form._id, 'Title:', form.title)
                handleExportCSV(form._id, form.title)
              }}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          {/* Test button for modal */}
          <Button 
            onClick={() => {
              console.log('Test button clicked - clearing selected submission')
              setSelectedSubmission(null)
            }}
            variant="outline"
            size="sm"
          >
            Clear Selection
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{form?.submissionCount || 0}</div>
              <div className="text-sm text-muted-foreground">Total Submissions</div>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{formSubmissions.length}</div>
              <div className="text-sm text-muted-foreground">Recent Submissions</div>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {form?.status === 'published' ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Submissions */}
      <div className="bg-card rounded-lg border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Submissions</h3>
          {form && form.submissionCount > 0 && (
            <Button
              onClick={() => {
                console.log('Export All button clicked for form:', form._id, 'Title:', form.title)
                handleExportCSV(form._id, form.title)
              }}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All as CSV
            </Button>
          )}
        </div>
        <div className="p-6">
          {formSubmissions.length > 0 ? (
            <div className="space-y-4">
              {formSubmissions.map((submission, index) => (
                <div key={submission._id} className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50">
                  <div>
                    <div className="font-medium">Submission #{formSubmissions.length - index}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(submission.submittedAt)}
                    </div>
                    {submission.submitterEmail && (
                      <div className="text-sm text-muted-foreground">
                        {submission.submitterEmail}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSubmission(submission._id, id!)}
                    className="text-primary hover:text-primary/80"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No submissions yet
            </div>
          )}
        </div>
      </div>

      {/* Debug info */}
      <div className="bg-blue-100 p-2 text-sm border-2 border-blue-500">
        Debug: Has Selected Submission: {(!!selectedSubmission).toString()}
        {selectedSubmission && <div className="text-blue-600 font-bold">Showing submission details below!</div>}
      </div>

      {/* Submission Details Section */}
      {selectedSubmission && (
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Submission Details</h3>
            <Button
              onClick={() => setSelectedSubmission(null)}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Submitted on</div>
              <div className="font-medium">{formatDate(selectedSubmission.submittedAt)}</div>
            </div>
            
            {selectedSubmission.submitterEmail && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Submitted by</div>
                <div className="font-medium">{selectedSubmission.submitterEmail}</div>
              </div>
            )}
            
            <div>
              <h4 className="text-lg font-medium mb-3">Responses</h4>
              {selectedSubmission.responses && selectedSubmission.responses.length > 0 ? (
                <div className="space-y-4">
                  {selectedSubmission.responses.map((response, index) => {
                    const field = form?.fields?.find(f => f.id === response.fieldId)
                    return (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          {field?.label || `Field ${response.fieldId}`}
                        </div>
                        <div className="text-foreground">
                          {Array.isArray(response.value) 
                            ? response.value.join(', ') 
                            : response.value || 'No response'
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-muted-foreground">No responses found</div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default Analytics