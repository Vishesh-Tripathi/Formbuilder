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
  maxFiles?: number;
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
  step?: number;
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
  redirectUrl?: string;
  redirectDelay?: number | false;
  showPoweredBy?: boolean;
  enableProgressBar?: boolean;
  allowDraftSave?: boolean;
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
    maxFileSize: { type: Number },
    maxFiles: { type: Number }
  },
  options: [{
    value: { type: String, required: true },
    label: { type: String, required: true }
  }],
  order: { type: Number, required: true, default: 0 },
  step: { type: Number }
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
  customCSS: { type: String },
  redirectUrl: { type: String },
  redirectDelay: { type: Schema.Types.Mixed, default: 3000 },
  showPoweredBy: { type: Boolean, default: true },
  enableProgressBar: { type: Boolean, default: false },
  allowDraftSave: { type: Boolean, default: false }
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
    unique: true,
    lowercase: true,
    trim: true,
    index: true
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
FormSchema.pre('save', async function(next) {
  try {
    // Only generate slug if it's not already set or if title has been modified
    if (this.isNew || (this.isModified('title') && (!this.slug || this.slug.trim() === ''))) {
      const generateSlug = (title: string) => {
        if (!title || title.trim() === '') {
          return 'untitled-form';
        }
        
        return title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      };

      let baseSlug = generateSlug(this.title);
      if (!baseSlug || baseSlug.trim() === '') {
        baseSlug = 'form';
      }
      
      // Ensure uniqueness
      let finalSlug = baseSlug;
      let counter = 1;
      
      const FormModel = mongoose.model('Form');
      while (await FormModel.findOne({ slug: finalSlug, _id: { $ne: this._id } })) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      this.slug = finalSlug;
    }
    next();
  } catch (error) {
    next(error as any);
  }
});

// Virtual for form URL
FormSchema.virtual('url').get(function() {
  return `/forms/${this.slug}`;
});

export const Form = mongoose.model<IForm>('Form', FormSchema);
export default Form;
