import mongoose, { Schema, Document } from 'mongoose';

// Submission Response Interface
export interface ISubmissionResponse {
  fieldId: string;
  value: any;
  files?: string[];
}

// Submission Document Interface
export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;
  formId: mongoose.Types.ObjectId;
  responses: ISubmissionResponse[];
  submitterEmail?: string;
  submitterIP?: string;
  submitterUserAgent?: string;
  metadata?: Record<string, any>;
  submittedAt: Date;
  isAnonymous: boolean;
}

// Submission Schema
const SubmissionResponseSchema = new Schema<ISubmissionResponse>({
  fieldId: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  files: [{ type: String }]
}, { _id: false });

const SubmissionSchema = new Schema<ISubmission>({
  formId: {
    type: Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
    index: true
  },
  responses: [SubmissionResponseSchema],
  submitterEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  submitterIP: {
    type: String,
    trim: true
  },
  submitterUserAgent: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  isAnonymous: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
SubmissionSchema.index({ formId: 1, submittedAt: -1 });
SubmissionSchema.index({ submitterEmail: 1 });
SubmissionSchema.index({ submittedAt: -1 });

// Virtual to populate form details
SubmissionSchema.virtual('form', {
  ref: 'Form',
  localField: 'formId',
  foreignField: '_id',
  justOne: true
});

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
export default Submission;
