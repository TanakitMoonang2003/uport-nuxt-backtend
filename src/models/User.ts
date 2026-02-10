import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'company' | 'teacher';
  isActive: boolean;

  // Student fields
  studentId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  yearOfStudy?: string;

  // Teacher fields
  teacherId?: string;
  title?: string;
  faculty?: string;
  department?: string;
  position?: string;
  officeRoom?: string;
  officePhone?: string;
  specialization?: string;

  // Company fields
  companyName?: string;
  contactFirstName?: string;
  contactLastName?: string;
  industry?: string;
  address?: string;
  description?: string;

  // Teacher confirmation fields
  isTeacherConfirmed?: boolean;
  confirmedBy?: string;
  confirmedAt?: Date;

  // Company approval fields
  isCompanyApproved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;

  // Profile picture
  profilePicture?: string;  // Base64 encoded image
  avatarUrl?: string;  // Avatar URL (base64 or external URL)

  // Additional profile fields
  bio?: string;
  skills?: string[];

  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'company', 'teacher'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Student fields
  studentId: {
    type: String,
    sparse: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  yearOfStudy: {
    type: String,
    trim: true
  },

  // Teacher fields
  teacherId: {
    type: String,
    sparse: true
  },
  title: {
    type: String,
    trim: true
  },
  faculty: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  officeRoom: {
    type: String,
    trim: true
  },
  officePhone: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },

  // Company fields
  companyName: {
    type: String,
    trim: true
  },
  contactFirstName: {
    type: String,
    trim: true
  },
  contactLastName: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  // Teacher confirmation fields
  isTeacherConfirmed: {
    type: Boolean,
    default: false
  },
  confirmedBy: {
    type: String,
    trim: true
  },
  confirmedAt: {
    type: Date
  },

  // Company approval fields
  isCompanyApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: String,
    trim: true
  },
  approvedAt: {
    type: Date
  },

  // Profile picture
  profilePicture: {
    type: String,
    required: false,
    default: ''
  },
  avatarUrl: {
    type: String,
    required: false,
    default: ''
  },

  // Additional profile fields
  bio: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  skills: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
