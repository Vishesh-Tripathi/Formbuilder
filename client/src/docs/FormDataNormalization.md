# Form Data Normalization for FormPreview Component

## Overview
The API response data needs to be normalized before it can be used with the FormPreview component. We've created utility functions to handle this normalization automatically.

## API Response Structure
Your API returns form data in this structure:
```javascript
{
  _id: "68a4b5b742600673cb432ce0",
  title: "Jee Form",
  description: "xyz",
  fields: [
    {
      id: "field_1755624856954_k33ybkee6",
      type: "text",
      label: "Text Input",
      validation: { required: false, fileTypes: [] },
      // ... other field properties
    }
    // ... more fields
  ],
  settings: {
    title: 'Jee Form',
    description: 'xyz',
    thankYouMessage: 'Thank you for your submission!',
    // ... other settings
  },
  // ... other form properties
}
```

## Normalization Functions

### 1. `normalizeFormDataForPreview(apiData)`
Converts raw API response to a fully normalized IForm object.

```typescript
import { normalizeFormDataForPreview } from '../lib/utils'

const normalizedForm = normalizeFormDataForPreview(apiResponseData)
```

### 2. `prepareFormForPreview(apiData)`
Extracts and normalizes just the essential data needed for FormPreview.

```typescript
import { prepareFormForPreview } from '../lib/utils'

const { form, fields, title, description } = prepareFormForPreview(apiResponseData)
```

## Usage Examples

### Method 1: Using the full normalized form object
```typescript
import FormPreview from '../components/FormPreview'
import { normalizeFormDataForPreview } from '../lib/utils'

const MyComponent = () => {
  const [formData, setFormData] = useState(null)
  
  useEffect(() => {
    // Fetch data from API
    fetchFormData().then(apiResponse => {
      const normalizedForm = normalizeFormDataForPreview(apiResponse.data)
      setFormData(normalizedForm)
    })
  }, [])

  const handleSubmit = (responses) => {
    console.log('Form submitted:', responses)
  }

  return (
    <FormPreview
      form={formData}
      onSubmit={handleSubmit}
      isSubmitting={false}
      showSubmitButton={true}
    />
  )
}
```

### Method 2: Using prepared data (recommended)
```typescript
import FormPreview from '../components/FormPreview'
import { prepareFormForPreview } from '../lib/utils'

const MyComponent = () => {
  const [formData, setFormData] = useState(null)
  
  useEffect(() => {
    fetchFormData().then(apiResponse => {
      const preparedData = prepareFormForPreview(apiResponse.data)
      setFormData(preparedData)
    })
  }, [])

  const handleSubmit = (responses) => {
    console.log('Form submitted:', responses)
  }

  if (!formData) return <div>Loading...</div>

  return (
    <FormPreview
      form={formData.form}
      fields={formData.fields}
      title={formData.title}
      description={formData.description}
      onSubmit={handleSubmit}
      isSubmitting={false}
      showSubmitButton={true}
    />
  )
}
```

### Method 3: Using individual props
```typescript
import FormPreview from '../components/FormPreview'
import { normalizeFormDataForPreview } from '../lib/utils'

const MyComponent = () => {
  const [normalizedForm, setNormalizedForm] = useState(null)
  
  useEffect(() => {
    fetchFormData().then(apiResponse => {
      const normalized = normalizeFormDataForPreview(apiResponse.data)
      setNormalizedForm(normalized)
    })
  }, [])

  const handleSubmit = (responses) => {
    console.log('Form submitted:', responses)
  }

  if (!normalizedForm) return <div>Loading...</div>

  return (
    <FormPreview
      fields={normalizedForm.fields}
      title={normalizedForm.title}
      description={normalizedForm.description}
      onSubmit={handleSubmit}
      isSubmitting={false}
      showSubmitButton={true}
    />
  )
}
```

## What the Normalization Functions Do

1. **Field Normalization:**
   - Ensures all fields have proper default values for optional properties
   - Sorts fields by their `order` property
   - Normalizes validation rules with proper defaults
   - Handles options arrays for select/radio/checkbox fields

2. **Settings Normalization:**
   - Provides default values for missing settings
   - Ensures proper boolean values for flags like `allowAnonymous`, `isPublic`
   - Sets default thank you message if not provided

3. **Form Structure Normalization:**
   - Ensures all required IForm properties are present
   - Handles both `_id` and `id` field variations
   - Provides default values for optional fields like `submissionCount`, `version`

## Important Notes

- The normalization functions are already integrated into the `Dashboard` and `FormView` components
- Fields are automatically sorted by their `order` property
- Missing optional properties get sensible defaults
- The functions are type-safe and return properly typed objects
- You can use either the full form object or individual props with FormPreview

## Example API Integration

```typescript
// In your component or service
const fetchAndNormalizeForm = async (formId: string) => {
  try {
    const response = await api.get(`/forms/${formId}`)
    
    if (response.data.success) {
      // Normalize the data before using it
      const normalizedForm = normalizeFormDataForPreview(response.data.data)
      return normalizedForm
    }
  } catch (error) {
    console.error('Error fetching form:', error)
    throw error
  }
}
```
