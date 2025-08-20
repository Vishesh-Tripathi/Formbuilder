import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Form } from '../models/Form.js';
import { Submission } from '../models/Submission.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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

// GET /api/forms - Get all forms
router.get('/', [
  query('status').optional().isIn(['draft', 'published', 'archived']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim(),
  query('includeFields').optional().isBoolean(),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { status, page = 1, limit = 10, search, includeFields } = req.query;
  
  // Build query
  const query: any = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build the find query
  let findQuery = Form.find(query)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Conditionally exclude fields for better performance unless specifically requested
  if (!includeFields || includeFields === 'false') {
    findQuery = findQuery.select('-fields');
  }

  // Execute query with pagination
  const [forms, total] = await Promise.all([
    findQuery,
    Form.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      forms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// GET /api/forms/:id - Get specific form
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid form ID'),
  query('includeFields').optional().isBoolean(),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { includeFields } = req.query;
  
  let findQuery = Form.findById(req.params.id);
  
  // Conditionally exclude fields for better performance unless specifically requested
  if (includeFields === 'false') {
    findQuery = findQuery.select('-fields');
  }
  
  const form = await findQuery;
  
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  res.json({
    success: true,
    data: { form }
  });
}));

// GET /api/forms/public/:slug - Get form by slug for public access
router.get('/public/:slug', [
  param('slug').isSlug().withMessage('Invalid form slug'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const form = await Form.findOne({ 
    slug: req.params.slug, 
    status: 'published',
    'settings.isPublic': true 
  }).select('title description fields settings submissionCount');
  
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found or not publicly accessible'
    });
  }

  res.json({
    success: true,
    data: { form }
  });
}));

// POST /api/forms - Create new form
router.post('/', [
  body('title').notEmpty().trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be between 1-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('fields').isArray().withMessage('Fields must be an array'),
  body('fields.*.id').notEmpty().withMessage('Field ID is required'),
  body('fields.*.type').isIn(['text', 'email', 'select', 'checkbox', 'radio', 'textarea', 'file', 'number', 'date']).withMessage('Invalid field type'),
  body('fields.*.label').notEmpty().trim().withMessage('Field label is required'),
  body('fields.*.order').isInt({ min: 0 }).withMessage('Field order must be a non-negative integer'),
  body('settings.title').notEmpty().trim().withMessage('Settings title is required'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { title, description, fields, settings } = req.body;

  // Create form
  const form = new Form({
    title,
    description,
    fields,
    settings: {
      ...settings,
      title: settings.title || title
    },
    status: 'draft'
  });

  await form.save();

  res.status(201).json({
    success: true,
    data: { form },
    message: 'Form created successfully'
  });
}));

// PUT /api/forms/:id - Update form
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid form ID'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('fields').optional().isArray(),
  body('settings').optional().isObject(),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { title, description, fields, settings, status } = req.body;

  const form = await Form.findById(req.params.id);
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  // Update fields
  if (title !== undefined) form.title = title;
  if (description !== undefined) form.description = description;
  if (fields !== undefined) form.fields = fields;
  if (settings !== undefined) form.settings = { ...form.settings, ...settings };
  if (status !== undefined) form.status = status;

  // Increment version on significant changes
  if (fields !== undefined) {
    form.version += 1;
  }

  await form.save();

  res.json({
    success: true,
    data: { form },
    message: 'Form updated successfully'
  });
}));

// DELETE /api/forms/:id - Delete form
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid form ID'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const form = await Form.findById(req.params.id);
  
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  // Delete associated submissions
  await Submission.deleteMany({ formId: form._id });
  
  // Delete the form
  await Form.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Form and associated submissions deleted successfully'
  });
}));

// POST /api/forms/:id/duplicate - Duplicate form
router.post('/:id/duplicate', [
  param('id').isMongoId().withMessage('Invalid form ID'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const originalForm = await Form.findById(req.params.id);
  
  if (!originalForm) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  // Create duplicate
  const duplicatedForm = new Form({
    title: `${originalForm.title} (Copy)`,
    description: originalForm.description,
    fields: originalForm.fields,
    settings: {
      ...originalForm.settings,
      title: `${originalForm.settings.title} (Copy)`
    },
    status: 'draft'
  });

  await duplicatedForm.save();

  res.status(201).json({
    success: true,
    data: { form: duplicatedForm },
    message: 'Form duplicated successfully'
  });
}));

// PATCH /api/forms/:id/status - Update form status
router.patch('/:id/status', [
  param('id').isMongoId().withMessage('Invalid form ID'),
  body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const form = await Form.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  res.json({
    success: true,
    data: { form },
    message: `Form ${req.body.status} successfully`
  });
}));

export default router;
