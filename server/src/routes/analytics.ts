import express from 'express';
import { param, query, validationResult } from 'express-validator';
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

// GET /api/analytics/:formId - Get form analytics
router.get('/:formId', [
  param('formId').isMongoId().withMessage('Invalid form ID'),
  query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { formId } = req.params;
  const { period = 'month', startDate, endDate } = req.query;

  // Verify form exists
  const form = await Form.findById(formId);
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  // Calculate date range
  const now = new Date();
  let start: Date;
  let end: Date = new Date(endDate) || now;

  if (startDate) {
    start = new Date(startDate);
  } else {
    switch (period) {
      case 'day':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Basic stats
  const [totalSubmissions, submissionsInPeriod] = await Promise.all([
    Submission.countDocuments({ formId }),
    Submission.countDocuments({
      formId,
      submittedAt: { $gte: start, $lte: end }
    })
  ]);

  // Submissions over time (daily breakdown)
  const submissionsByDay = await Submission.aggregate([
    {
      $match: {
        formId: form._id,
        submittedAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$submittedAt' },
          month: { $month: '$submittedAt' },
          day: { $dayOfMonth: '$submittedAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Field response analysis
  const fieldAnalytics = await Submission.aggregate([
    {
      $match: {
        formId: form._id,
        submittedAt: { $gte: start, $lte: end }
      }
    },
    { $unwind: '$responses' },
    {
      $group: {
        _id: '$responses.fieldId',
        totalResponses: { $sum: 1 },
        uniqueResponses: { $addToSet: '$responses.value' },
        responses: { $push: '$responses.value' }
      }
    },
    {
      $addFields: {
        uniqueResponseCount: { $size: '$uniqueResponses' }
      }
    }
  ]);

  // Create field analytics map
  const fieldAnalyticsMap = new Map();
  fieldAnalytics.forEach(field => {
    const fieldConfig = form.fields.find(f => f.id === field._id);
    if (fieldConfig) {
      let valueDistribution: any = {};
      
      // For select/radio/checkbox fields, calculate value distribution
      if (['select', 'radio', 'checkbox'].includes(fieldConfig.type)) {
        field.responses.forEach((response: any) => {
          if (Array.isArray(response)) {
            // Handle checkbox arrays
            response.forEach((val: any) => {
              valueDistribution[val] = (valueDistribution[val] || 0) + 1;
            });
          } else {
            valueDistribution[response] = (valueDistribution[response] || 0) + 1;
          }
        });
      }

      fieldAnalyticsMap.set(field._id, {
        fieldId: field._id,
        fieldLabel: fieldConfig.label,
        fieldType: fieldConfig.type,
        totalResponses: field.totalResponses,
        uniqueResponseCount: field.uniqueResponseCount,
        responseRate: (field.totalResponses / submissionsInPeriod) * 100,
        valueDistribution,
        averageLength: fieldConfig.type === 'text' || fieldConfig.type === 'textarea'
          ? field.responses.reduce((acc: number, val: string) => acc + (val?.length || 0), 0) / field.responses.length
          : null
      });
    }
  });

  // Response patterns (hourly distribution)
  const responsePatterns = await Submission.aggregate([
    {
      $match: {
        formId: form._id,
        submittedAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: { $hour: '$submittedAt' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Device/browser analytics (if available)
  const deviceAnalytics = await Submission.aggregate([
    {
      $match: {
        formId: form._id,
        submittedAt: { $gte: start, $lte: end },
        submitterUserAgent: { $exists: true, $ne: '' }
      }
    },
    {
      $group: {
        _id: null,
        userAgents: { $push: '$submitterUserAgent' }
      }
    }
  ]);

  // Calculate completion rate (assuming form has required fields)
  const requiredFields = form.fields.filter(f => f.validation.required);
  const completionRate = requiredFields.length > 0 
    ? (submissionsInPeriod / (submissionsInPeriod || 1)) * 100 
    : 100;

  // Calculate average completion time (if we had start timestamps)
  // For now, we'll use a placeholder
  const averageCompletionTime = null;

  res.json({
    success: true,
    data: {
      overview: {
        totalSubmissions,
        submissionsInPeriod,
        completionRate: Math.round(completionRate * 100) / 100,
        averageCompletionTime,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          label: period
        }
      },
      submissionsTrend: submissionsByDay.map(item => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        count: item.count
      })),
      fieldAnalytics: Array.from(fieldAnalyticsMap.values()),
      responsePatterns: {
        hourlyDistribution: responsePatterns.map(item => ({
          hour: item._id,
          count: item.count
        }))
      },
      form: {
        title: form.title,
        status: form.status,
        createdAt: form.createdAt,
        lastSubmittedAt: form.lastSubmittedAt
      }
    }
  });
}));

// GET /api/analytics/:formId/export - Export analytics as CSV
router.get('/:formId/export', [
  param('formId').isMongoId().withMessage('Invalid form ID'),
  handleValidationErrors
], asyncHandler(async (req: any, res: any) => {
  const { formId } = req.params;

  const form = await Form.findById(formId);
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  // Get all submissions for the form
  const submissions = await Submission.find({ formId }).sort({ submittedAt: -1 });

  // Generate analytics CSV
  let csv = 'Date,Total Submissions,New Submissions\n';
  
  // Group submissions by date
  const submissionsByDate = new Map();
  submissions.forEach(submission => {
    const date = submission.submittedAt.toISOString().split('T')[0];
    submissionsByDate.set(date, (submissionsByDate.get(date) || 0) + 1);
  });

  // Generate daily data for the last 30 days
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const newSubmissions = submissionsByDate.get(dateStr) || 0;
    const totalUpToDate = submissions.filter(s => s.submittedAt <= date).length;
    
    csv += `${dateStr},${totalUpToDate},${newSubmissions}\n`;
  }

  const filename = `${form.title.replace(/[^\w\s-]/g, '')}-analytics-${today.toISOString().split('T')[0]}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}));

// GET /api/analytics/dashboard - Get dashboard overview
router.get('/dashboard/overview', asyncHandler(async (req: any, res: any) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalForms,
    publishedForms,
    totalSubmissions,
    recentSubmissions,
    topForms
  ] = await Promise.all([
    Form.countDocuments(),
    Form.countDocuments({ status: 'published' }),
    Submission.countDocuments(),
    Submission.countDocuments({ submittedAt: { $gte: thirtyDaysAgo } }),
    Form.aggregate([
      { $match: { status: 'published' } },
      { $sort: { submissionCount: -1 } },
      { $limit: 5 },
      { $project: { title: 1, submissionCount: 1, status: 1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalForms,
        publishedForms,
        draftForms: totalForms - publishedForms,
        totalSubmissions,
        recentSubmissions,
        submissionGrowth: recentSubmissions > 0 ? '+' : '0'
      },
      topPerformingForms: topForms,
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString()
      }
    }
  });
}));

export default router;
