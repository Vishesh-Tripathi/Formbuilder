// Example of how to use normalized form data with FormPreview component

import React from 'react'
import FormPreview from '../components/FormPreview'
import { normalizeFormDataForPreview, prepareFormForPreview } from '../lib/utils'

// Your API response data (the data structure you provided)
const apiResponseData = {
  _id: "68a4b5b742600673cb432ce0",
  createdAt: "2025-08-19T17:34:47.379Z",
  description: "xyz",
  fields: [
    {
      id: "field_1755624856954_k33ybkee6",
      type: "text",
      label: "Text Input",
      placeholder: "",
      helpText: "",
      options: [],
      order: 0,
      validation: {
        required: false,
        fileTypes: []
      }
    },
    {
      id: "field_1755624858331_moww8s331", 
      type: "select",
      label: "Select Dropdown",
      placeholder: "",
      helpText: "",
      options: [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" }
      ],
      order: 1,
      validation: {
        required: false,
        fileTypes: []
      }
    },
    {
      id: "field_1755624859588_f6owro5gr",
      type: "email", 
      label: "Email",
      placeholder: "",
      helpText: "",
      options: [],
      order: 2,
      validation: {
        required: false,
        fileTypes: []
      }
    },
    {
      id: "field_1755624860278_i988cjyy5",
      type: "radio",
      label: "Radio Button", 
      placeholder: "",
      helpText: "",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" }
      ],
      order: 3,
      validation: {
        required: false,
        fileTypes: []
      }
    },
    {
      id: "field_1755624861430_8dtcxp9pi",
      type: "file",
      label: "File Upload",
      placeholder: "",
      helpText: "",
      options: [],
      order: 4,
      validation: {
        required: false,
        fileTypes: []
      }
    }
  ],
  settings: {
    title: 'Jee Form',
    description: 'xyz', 
    thankYouMessage: 'Thank you for your submission!',
    allowAnonymous: true,
    isPublic: true,
  },
  slug: "jee-form",
  status: "draft",
  submissionCount: 0,
  title: "Jee Form",
  updatedAt: "2025-08-19T17:34:47.379Z",
  url: "/forms/jee-form",
  version: 1,
  __v: 0
}

// Example Component showing different ways to use the normalized data
const ExampleFormPreviewUsage: React.FC = () => {
  
  // Method 1: Using the full normalization function
  const normalizedForm = normalizeFormDataForPreview(apiResponseData)
  
  // Method 2: Using the prepared data function (extracts the essentials)
  const preparedData = prepareFormForPreview(apiResponseData)
  
  const handleFormSubmit = (responses: any[]) => {
    console.log('Form submitted with responses:', responses)
    // Handle form submission logic here
  }

  return (
    <div className="space-y-8">
      <h1>Form Preview Examples</h1>
      
      {/* Example 1: Using the full normalized form object */}
      <div>
        <h2>Method 1: Using normalized form object</h2>
        <FormPreview
          form={normalizedForm}
          onSubmit={handleFormSubmit}
          isSubmitting={false}
          showSubmitButton={true}
        />
      </div>
      
      {/* Example 2: Using the prepared data (recommended for most cases) */}
      <div>
        <h2>Method 2: Using prepared form data</h2>
        <FormPreview
          form={preparedData.form}
          fields={preparedData.fields}
          title={preparedData.title}
          description={preparedData.description}
          onSubmit={handleFormSubmit}
          isSubmitting={false}
          showSubmitButton={true}
        />
      </div>
      
      {/* Example 3: Using individual props (if you don't want to pass the full form object) */}
      <div>
        <h2>Method 3: Using individual props</h2>
        <FormPreview
          fields={normalizedForm.fields}
          title={normalizedForm.title}
          description={normalizedForm.description}
          onSubmit={handleFormSubmit}
          isSubmitting={false}
          showSubmitButton={true}
        />
      </div>
    </div>
  )
}

export default ExampleFormPreviewUsage
