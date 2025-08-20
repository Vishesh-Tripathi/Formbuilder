import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Eye, Edit, Trash2, Copy, BarChart3 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import api from '../lib/api'
import { normalizeFormDataForPreview } from '../lib/utils'
import { IForm, IFormField, IFormSettings } from '../types'

interface FormsResponse {
  success: boolean
  data: {
    forms: IForm[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

interface ErrorResponse {
  success: false
  error: string
  details?: any[]
}

const Dashboard: React.FC = () => {
  const [forms, setForms] = useState<IForm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchForms(1) // Reset to page 1 when search or filter changes
  }, [debouncedSearchTerm, statusFilter])

  const fetchForms = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page,
        limit: pagination.limit,
        includeFields: true, // Include fields to get complete form data
      }
      
      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim()
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      const response = await api.get<FormsResponse>('/forms', { params })
      
      if (response.data.success) {
        console.log('Forms with fields:', response.data.data)
        // Normalize the form data before setting state
        const normalizedForms = response.data.data.forms.map((form: any) => normalizeFormDataForPreview(form))
        setForms(normalizedForms)
        setPagination(response.data.data.pagination)
      } else {
        setError('Failed to fetch forms')
      }
    } catch (error: any) {
      console.error('Error fetching forms:', error)
      setError(error?.response?.data?.error || 'Failed to fetch forms')
    } finally {
      setLoading(false)
    }
  }

  console.log('Forms:', forms)

  // Since filtering is now done on the server, we don't need client-side filtering
  // But we'll keep this for any additional client-side filtering if needed
  const filteredForms = forms

  const handleDeleteForm = async (formId: string) => {
    if (!window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/forms/${formId}`)
      setForms(forms.filter(form => form._id !== formId))
    } catch (error: any) {
      console.error('Error deleting form:', error)
      alert(error?.response?.data?.error || 'Failed to delete form')
    }
  }

  const handleCopyForm = async (formId: string) => {
    try {
      const response = await api.post(`/forms/${formId}/duplicate`)
      if (response.data.success) {
        fetchForms(pagination.page) // Refresh the current page
      }
    } catch (error: any) {
      console.error('Error copying form:', error)
      alert(error?.response?.data?.error || 'Failed to copy form')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-100'
      case 'draft':
        return 'text-yellow-600 bg-yellow-100'
      case 'archived':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchForms(1)}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your forms and view analytics</p>
        </div>
        <Link to="/forms/new">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Create New Form
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Forms</p>
              <p className="text-2xl font-semibold text-foreground">{forms.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Published Forms</p>
              <p className="text-2xl font-semibold text-foreground">
                {forms.filter(f => f.status === 'published').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <Edit className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Draft Forms</p>
              <p className="text-2xl font-semibold text-foreground">
                {forms.filter(f => f.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
              <p className="text-2xl font-semibold text-foreground">
                {forms.reduce((sum, form) => sum + form.submissionCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-input bg-background px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Forms</h2>
        </div>
        
        {filteredForms.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No forms found</p>
            <Link to="/forms/new">
              <Button>Create your first form</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredForms.map((form) => (
                  <tr key={form._id} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">{form.title}</div>
                        <div className="text-sm text-muted-foreground">{form.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(form.status)}`}>
                        {form.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {form.submissionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(form.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/forms/${form._id}`}>
                          <Button variant="ghost" size="sm" title="View form">
                            <Eye size={16} />
                          </Button>
                        </Link>
                        <Link to={`/forms/${form._id}/analytics`}>
                          <Button variant="ghost" size="sm" title="View analytics">
                            <BarChart3 size={16} />
                          </Button>
                        </Link>
                        <Link to={`/forms/${form._id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit form">
                            <Edit size={16} />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopyForm(form._id)}
                          title="Duplicate form"
                        >
                          <Copy size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteForm(form._id)}
                          title="Delete form"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} forms
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchForms(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            
            {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
              const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i
              if (pageNum > pagination.pages) return null
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => fetchForms(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchForms(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
