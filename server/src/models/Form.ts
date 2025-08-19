import mongoose, { Schema, Document } from 'mongoose';

// Field Configuration Interface
export interface IFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  fileTypes?: string[];
  maxFileSize?: number;
}

export interface IFieldOption {
  value: string;
  label: string;
}

export interface IFormField {
  id: string;
  type: 'text' | 'email' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file' | 'number' | 'date';
  label: string;
  placeholder?: string;
  helpText?: string;
  validation: IFieldValidation;
  options?: IFieldOption[];
  order: number;
}

// Form Settings Interface
export interface IFormSettings {
  title: string;
  description?: string;
  thankYouMessage?: string;
  submissionLimit?: number;
  allowAnonymous?: boolean;
  isPublic?: boolean;
  collectEmail?: boolean;
  requireLogin?: boolean;
  customCSS?: string;
}

// Form Document Interface
export interface IForm extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  fields: IFormField[];
  settings: IFormSettings;
  status: 'draft' | 'published' | 'archived';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  submissionCount: number;
  lastSubmittedAt?: Date;
  slug: string;
  version: number;
}

// Form Schema
const FormFieldSchema = new Schema<IFormField>({
  id: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['text', 'email', 'select', 'checkbox', 'radio', 'textarea', 'file', 'number', 'date']
  },
  label: { type: String, required: true },
  placeholder: { type: String },
  helpText: { type: String },
  validation: {
    required: { type: Boolean, default: false },
    minLength: { type: Number },
    maxLength: { type: Number },
    pattern: { type: String },
    min: { type: Number },
    max: { type: Number },
    fileTypes: [{ type: String }],
    maxFileSize: { type: Number }
  },
  options: [{
    value: { type: String, required: true },
    label: { type: String, required: true }
  }],
  order: { type: Number, required: true, default: 0 }
}, { _id: false });

const FormSettingsSchema = new Schema<IFormSettings>({
  title: { type: String, required: true },
  description: { type: String },
  thankYouMessage: { type: String, default: 'Thank you for your submission!' },
  submissionLimit: { type: Number },
  allowAnonymous: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },
  collectEmail: { type: Boolean, default: false },
  requireLogin: { type: Boolean, default: false },
  customCSS: { type: String }
}, { _id: false });

const FormSchema = new Schema<IForm>({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200 
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 1000 
  },
  fields: [FormFieldSchema],
  settings: { 
    type: FormSettingsSchema, 
    required: true 
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  submissionCount: {
    type: Number,
    default: 0
  },
  lastSubmittedAt: {
    type: Date
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
FormSchema.index({ slug: 1 });
FormSchema.index({ status: 1 });
FormSchema.index({ createdAt: -1 });
FormSchema.index({ createdBy: 1, status: 1 });

// Pre-save middleware to generate slug
FormSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Ensure uniqueness by appending timestamp if needed
    const timestamp = Date.now().toString().slice(-6);
    this.slug = `${this.slug}-${timestamp}`;
  }
  next();
});

// Virtual for form URL
FormSchema.virtual('url').get(function() {
  return `/forms/${this.slug}`;
});

export const Form = mongoose.model<IForm>('Form', FormSchema);
export default Form;
