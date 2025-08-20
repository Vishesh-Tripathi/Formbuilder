import React, { useState } from 'react'
import { IForm, IFormField } from '../types'
import PublicFormRenderer from '../components/PublicFormRenderer'
import { ProgressStepper } from '../components/FormProgressWrapper'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'

/**
 * FormSubmissionExample
 * 
 * This component demonstrates all the form submission features:
 * 1. Public form rendering with responsive design
 * 2. File upload support with validation
 * 3. Success/error handling with custom messages
 * 4. Progress indicators for multi-step forms
 */
const FormSubmissionExample: React.FC = () => {
  const [currentExample, setCurrentExample] = useState<'basic' | 'multistep' | 'fileupload'>('basic')

  // Example 1: Basic Contact Form
  const basicForm: IForm = {
    _id: 'example-basic',
    title: 'Contact Us',
    description: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
    status: 'published',
    slug: 'contact-form',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 0,
    settings: {
      title: 'Contact Us',
      description: 'We\'d love to hear from you',
      thankYouMessage: 'Thank you for reaching out! We\'ll get back to you within 24 hours.',
      isPublic: true,
      allowAnonymous: true,
      redirectUrl: 'https://example.com/thank-you',
      redirectDelay: 3000,
      showPoweredBy: true,
    },
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        validation: {
          required: true,
          minLength: 2,
          maxLength: 100
        },
        order: 1
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'your.email@example.com',
        helpText: 'We\'ll never share your email with anyone else.',
        validation: {
          required: true
        },
        order: 2
      },
      {
        id: 'subject',
        type: 'select',
        label: 'Subject',
        placeholder: 'Choose a subject',
        options: [
          { value: 'general', label: 'General Inquiry' },
          { value: 'support', label: 'Technical Support' },
          { value: 'sales', label: 'Sales Question' },
          { value: 'feedback', label: 'Feedback' }
        ],
        validation: {
          required: true
        },
        order: 3
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Message',
        placeholder: 'Tell us how we can help you...',
        validation: {
          required: true,
          minLength: 10,
          maxLength: 1000
        },
        order: 4
      }
    ]
  }

  // Example 2: Multi-Step Registration Form
  const multiStepForm: IForm = {
    _id: 'example-multistep',
    title: 'User Registration',
    description: 'Create your account in just a few steps',
    status: 'published',
    slug: 'registration-form',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 0,
    settings: {
      title: 'User Registration',
      description: 'Create your account',
      thankYouMessage: 'Welcome! Your account has been created successfully.',
      isPublic: true,
      enableProgressBar: true,
      allowDraftSave: true
    },
    fields: [
      // Step 1: Personal Information
      {
        id: 'firstName',
        type: 'text',
        label: 'First Name',
        step: 0,
        validation: { required: true, minLength: 1, maxLength: 50 },
        order: 1
      },
      {
        id: 'lastName',
        type: 'text',
        label: 'Last Name',
        step: 0,
        validation: { required: true, minLength: 1, maxLength: 50 },
        order: 2
      },
      {
        id: 'birthDate',
        type: 'date',
        label: 'Date of Birth',
        step: 0,
        validation: { required: true },
        order: 3
      },
      // Step 2: Contact Information
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        step: 1,
        validation: { required: true },
        order: 4
      },
      {
        id: 'phone',
        type: 'text',
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567',
        step: 1,
        validation: {
          required: false,
          pattern: '^[+]?[(]?[\\d\\s\\-\\(\\)]{10,}$'
        },
        order: 5
      },
      // Step 3: Preferences
      {
        id: 'interests',
        type: 'checkbox',
        label: 'Areas of Interest',
        step: 2,
        options: [
          { value: 'technology', label: 'Technology' },
          { value: 'design', label: 'Design' },
          { value: 'marketing', label: 'Marketing' },
          { value: 'business', label: 'Business' }
        ],
        validation: { required: false },
        order: 6
      },
      {
        id: 'newsletter',
        type: 'radio',
        label: 'Newsletter Subscription',
        step: 2,
        options: [
          { value: 'weekly', label: 'Weekly Newsletter' },
          { value: 'monthly', label: 'Monthly Newsletter' },
          { value: 'never', label: 'No Newsletter' }
        ],
        validation: { required: true },
        order: 7
      }
    ]
  }

  // Example 3: File Upload Form
  const fileUploadForm: IForm = {
    _id: 'example-fileupload',
    title: 'Document Submission',
    description: 'Upload your documents securely',
    status: 'published',
    slug: 'document-upload',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 0,
    settings: {
      title: 'Document Submission',
      thankYouMessage: 'Your documents have been received and are being processed.',
      isPublic: true
    },
    fields: [
      {
        id: 'applicantName',
        type: 'text',
        label: 'Applicant Name',
        validation: { required: true },
        order: 1
      },
      {
        id: 'applicationId',
        type: 'text',
        label: 'Application ID',
        placeholder: 'APP-2024-XXXX',
        helpText: 'Enter the application ID provided in your confirmation email',
        validation: { required: true },
        order: 2
      },
      {
        id: 'documents',
        type: 'file',
        label: 'Required Documents',
        helpText: 'Upload all required documents (PDF, DOC, or DOCX)',
        validation: {
          required: true,
          fileTypes: ['.pdf', '.doc', '.docx', 'application/pdf', 
                     'application/msword', 
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          maxFileSize: 10, // 10MB
          maxFiles: 5
        },
        order: 3
      },
      {
        id: 'photos',
        type: 'file',
        label: 'Supporting Photos (Optional)',
        helpText: 'Upload photos that support your application',
        validation: {
          required: false,
          fileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp',
                     'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          maxFileSize: 5, // 5MB
          maxFiles: 10
        },
        order: 4
      },
      {
        id: 'additionalComments',
        type: 'textarea',
        label: 'Additional Comments',
        placeholder: 'Any additional information you\'d like to provide...',
        validation: { required: false, maxLength: 500 },
        order: 5
      }
    ]
  }

  const handleSubmission = (responses: any[]) => {
    console.log('Form submitted with responses:', responses)
    // In a real application, this would submit to your API
    alert('Form submitted successfully!')
  }

  const renderExample = () => {
    switch (currentExample) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Basic Contact Form Example</h3>
              <p className="text-blue-800 text-sm">
                This example shows a simple contact form with validation, custom success message, 
                and redirect functionality.
              </p>
            </div>
            <PublicFormRenderer 
              form={basicForm} 
              onSubmit={handleSubmission}
            />
          </div>
        )
      
      case 'multistep':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Multi-Step Form Example</h3>
              <p className="text-green-800 text-sm">
                This registration form demonstrates multi-step functionality with progress tracking, 
                step validation, and navigation controls.
              </p>
            </div>
            <PublicFormRenderer 
              form={multiStepForm} 
              onSubmit={handleSubmission}
            />
          </div>
        )
      
      case 'fileupload':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">File Upload Form Example</h3>
              <p className="text-purple-800 text-sm">
                This form showcases advanced file upload capabilities with type validation, 
                size limits, multiple file support, and drag-and-drop functionality.
              </p>
            </div>
            <PublicFormRenderer 
              form={fileUploadForm} 
              onSubmit={handleSubmission}
            />
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Form Submission Features Demo
        </h1>
        <p className="text-gray-600">
          Explore the comprehensive form submission features including public forms, 
          file uploads, success handling, and progress indicators.
        </p>
      </div>

      {/* Example Selector */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={currentExample === 'basic' ? 'default' : 'outline'}
            onClick={() => setCurrentExample('basic')}
          >
            Basic Contact Form
          </Button>
          <Button 
            variant={currentExample === 'multistep' ? 'default' : 'outline'}
            onClick={() => setCurrentExample('multistep')}
          >
            Multi-Step Registration
          </Button>
          <Button 
            variant={currentExample === 'fileupload' ? 'default' : 'outline'}
            onClick={() => setCurrentExample('fileupload')}
          >
            File Upload Form
          </Button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mb-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📱 Responsive</h3>
          <p className="text-sm text-gray-600">
            Forms adapt to all screen sizes with mobile-first design
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📁 File Uploads</h3>
          <p className="text-sm text-gray-600">
            Secure file uploads with validation and progress tracking
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">✅ Smart Validation</h3>
          <p className="text-sm text-gray-600">
            Real-time validation with custom error messages
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">🚀 Multi-Step</h3>
          <p className="text-sm text-gray-600">
            Progressive forms with step indicators and navigation
          </p>
        </div>
      </div>

      {/* Current Example */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {renderExample()}
      </div>

      {/* Implementation Notes */}
      <div className="mt-8 space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Implementation Note:</strong> These examples are fully functional 
            demonstrations of the form submission system. In a production environment, 
            forms would be created through the form builder interface and accessed via 
            public URLs like <code>/public/contact-form</code>.
          </AlertDescription>
        </Alert>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Key Features Demonstrated:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Public Form Access:</strong> Forms accessible via clean, SEO-friendly URLs</li>
            <li>• <strong>Responsive Design:</strong> Mobile-optimized layouts with proper spacing</li>
            <li>• <strong>File Upload Support:</strong> Drag-and-drop with type and size validation</li>
            <li>• <strong>Real-time Validation:</strong> Instant feedback as users type</li>
            <li>• <strong>Custom Success Messages:</strong> Personalized thank you messages</li>
            <li>• <strong>Redirect Handling:</strong> Automatic redirects with configurable delays</li>
            <li>• <strong>Multi-step Navigation:</strong> Progress indicators and step management</li>
            <li>• <strong>Error Recovery:</strong> Graceful error handling with retry options</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default FormSubmissionExample
