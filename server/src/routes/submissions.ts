import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { Form } from '../models/Form.js';
import { Submission } from '../models/Submission.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// POST /api/submissions/:formId - Submit form response
router.post('/:formId', submissionLimiter, [
  param('formId').isMongoId().withMessage('Invalid form ID'),
  body('responses').isArray({ min: 1 }).withMessage('Responses are required'),
  body('responses.*.fieldId').notEmpty().withMessage('Field ID is required'),
  body('responses.*.value').exists().withMessage('Field value is required'),
  body('submitterEmail').optional().isEmail().normalizeEmail(),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { formId } = req.params;
  const { responses, submitterEmail } = req.body;

  // Find and validate form
  const form = await Form.findById(formId);
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  // Check if form is published
  if (form.status !== 'published') {
    return res.status(400).json({
      success: false,
      error: 'Form is not available for submissions'
    });
  }

  // Check submission limit
  if (form.settings.submissionLimit) {
    const currentCount = await Submission.countDocuments({ formId });
    if (currentCount >= form.settings.submissionLimit) {
      return res.status(429).json({
        success: false,
        error: 'Form submission limit reached'
      });
    }
  }

  // Validate responses against form fields
  const fieldMap = new Map(form.fields.map(field => [field.id, field]));
  const validationErrors: string[] = [];

  for (const response of responses) {
    const field = fieldMap.get(response.fieldId);
    if (!field) {
      validationErrors.push(`Invalid field ID: ${response.fieldId}`);
      continue;
    }

    // Check required fields
    if (field.validation.required && (!response.value || response.value === '')) {
      validationErrors.push(`Field "${field.label}" is required`);
    }

    // Validate field type-specific rules
    if (response.value) {
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(response.value)) {
            validationErrors.push(`Field "${field.label}" must be a valid email`);
          }
          break;
        
        case 'number':
          const num = parseFloat(response.value);
          if (isNaN(num)) {
            validationErrors.push(`Field "${field.label}" must be a number`);
          } else {
            if (field.validation.min !== undefined && num < field.validation.min) {
              validationErrors.push(`Field "${field.label}" must be at least ${field.validation.min}`);
            }
            if (field.validation.max !== undefined && num > field.validation.max) {
              validationErrors.push(`Field "${field.label}" must be at most ${field.validation.max}`);
            }
          }
          break;
        
        case 'text':
        case 'textarea':
          if (field.validation.minLength && response.value.length < field.validation.minLength) {
            validationErrors.push(`Field "${field.label}" must be at least ${field.validation.minLength} characters`);
          }
          if (field.validation.maxLength && response.value.length > field.validation.maxLength) {
            validationErrors.push(`Field "${field.label}" must be at most ${field.validation.maxLength} characters`);
          }
          if (field.validation.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(response.value)) {
              validationErrors.push(`Field "${field.label}" format is invalid`);
            }
          }
          break;

        case 'file':
          // Validate file uploads if present
          if (response.files && response.files.length > 0) {
            if (field.validation.maxFiles && response.files.length > field.validation.maxFiles) {
              validationErrors.push(`Field "${field.label}" allows maximum ${field.validation.maxFiles} files`);
            }
          }
          break;
      }
    }
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors
    });
  }

  // Create submission
  const submission = new Submission({
    formId,
    responses,
    submitterEmail: submitterEmail || undefined,
    submitterIP: req.ip,
    submitterUserAgent: req.get('User-Agent'),
    isAnonymous: !submitterEmail,
    metadata: {
      referer: req.get('Referer'),
      origin: req.get('Origin')
    }
  });

  await submission.save();

  // Update form submission count and last submitted date
  await Form.findByIdAndUpdate(formId, {
    $inc: { submissionCount: 1 },
    lastSubmittedAt: new Date()
  });

  res.status(201).json({
    success: true,
    message: form.settings.thankYouMessage || 'Thank you for your submission!',
    data: {
      submissionId: submission._id,
      submittedAt: submission.submittedAt
    }
  });
}));

// GET /api/submissions/:formId - Get form submissions (admin only)
router.get('/:formId', [
  param('formId').isMongoId().withMessage('Invalid form ID'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { formId } = req.params;
  const { page = 1, limit = 50, startDate, endDate } = req.query;

  // Verify form exists
  const form = await Form.findById(formId);
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const query: any = { formId };
  if (Object.keys(dateFilter).length > 0) {
    query.submittedAt = dateFilter;
  }

  // Get submissions with pagination
  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Submission.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      submissions,
      form: {
        title: form.title,
        fields: form.fields
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// GET /api/submissions/:formId/export - Export submissions as CSV
router.get('/:formId/export', [
  param('formId').isMongoId().withMessage('Invalid form ID'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { formId } = req.params;
  const { startDate, endDate } = req.query;

  console.log(`CSV Export request for form ID: ${formId}`);
  console.log('Query params:', { startDate, endDate });

  // Verify form exists
  const form = await Form.findById(formId);
  if (!form) {
    console.log(`Form not found for ID: ${formId}`);
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  console.log(`Found form: ${form.title} with ${form.fields?.length || 0} fields`);

  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const query: any = { formId };
  if (Object.keys(dateFilter).length > 0) {
    query.submittedAt = dateFilter;
  }

  console.log('Submission query:', query);

  const submissions = await Submission.find(query).sort({ submittedAt: -1 }).lean();
  console.log(`Found ${submissions.length} submissions for export`);

  // Generate CSV
  let csv = 'Submission ID,Submitted At,Email';
  
  // Add field headers
  form.fields.forEach(field => {
    csv += `,${field.label.replace(/,/g, ';')}`;
  });
  csv += '\n';

  // Add submission data
  submissions.forEach(submission => {
    let row = `${submission._id},${submission.submittedAt.toISOString()},${submission.submitterEmail || ''}`;
    
    // Create response map for easy lookup
    const responseMap = new Map(submission.responses.map(r => [r.fieldId, r.value]));
    
    form.fields.forEach(field => {
      const value = responseMap.get(field.id) || '';
      // Escape commas and quotes in CSV
      const escapedValue = String(value).replace(/"/g, '""');
      row += `,"${escapedValue}"`;
    });
    
    csv += row + '\n';
  });

  console.log('CSV generated successfully, length:', csv.length);

  // Set headers for file download
  const filename = `${form.title.replace(/[^\w\s-]/g, '')}-submissions-${new Date().toISOString().split('T')[0]}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}));

// GET /api/submissions/:formId/:submissionId - Get specific submission
router.get('/:formId/:submissionId', [
  param('formId').isMongoId().withMessage('Invalid form ID'),
  param('submissionId').isMongoId().withMessage('Invalid submission ID'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { formId, submissionId } = req.params;

  const submission = await Submission.findOne({
    _id: submissionId,
    formId
  }).populate('formId', 'title fields');

  if (!submission) {
    return res.status(404).json({
      success: false,
      error: 'Submission not found'
    });
  }

  res.json({
    success: true,
    data: { submission }
  });
}));

// DELETE /api/submissions/:formId/:submissionId - Delete submission
router.delete('/:formId/:submissionId', [
  param('formId').isMongoId().withMessage('Invalid form ID'),
  param('submissionId').isMongoId().withMessage('Invalid submission ID'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { formId, submissionId } = req.params;

  const submission = await Submission.findOneAndDelete({
    _id: submissionId,
    formId
  });

  if (!submission) {
    return res.status(404).json({
      success: false,
      error: 'Submission not found'
    });
  }

  // Update form submission count
  await Form.findByIdAndUpdate(formId, {
    $inc: { submissionCount: -1 }
  });

  res.json({
    success: true,
    message: 'Submission deleted successfully'
  });
}));

export default router;
