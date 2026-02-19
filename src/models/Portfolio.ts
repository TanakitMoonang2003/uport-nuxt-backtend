import mongoose, { Document, Schema } from 'mongoose';

export interface IPortfolio extends Document {
  id: number;
  category: string;
  title: string;
  description: string;
  fullDescription: string;
  technologies: string[];
  image: string;
  demoUrl?: string;
  githubUrl?: string;
  features: string[];
  duration: string;
  client: string;
  // Upload form fields
  uploadedFile?: string;
  images?: string[];  // Multiple images (base64 or URL)
  repoUrl?: string;
  details?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['web', 'mobile', 'uiux', 'fullstack', 'game', 'design', 'data', 'ai', 'other']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  fullDescription: {
    type: String,
    required: true,
    trim: true
  },
  technologies: [{
    type: String,
    required: false
  }],
  image: {
    type: String,
    required: false,
    default: 'https://placehold.co/800x600/FCD34D/1F2937?text=No+Image'
  },
  demoUrl: {
    type: String,
    default: ''
  },
  githubUrl: {
    type: String,
    default: ''
  },
  features: [{
    type: String,
    required: false
  }],
  duration: {
    type: String,
    required: true
  },
  client: {
    type: String,
    required: true
  },
  // Upload form fields
  uploadedFile: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  repoUrl: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: String,
    default: ''
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create index for better query performance
PortfolioSchema.index({ category: 1 });
PortfolioSchema.index({ id: 1 });

export default mongoose.models.Portfolio || mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
