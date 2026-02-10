import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  expires: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OTPSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  expires: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for better performance
OTPSchema.index({ email: 1, isUsed: 1 });
OTPSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

// Static method to clean expired OTPs
OTPSchema.statics.cleanExpired = async function() {
  return this.deleteMany({ expires: { $lt: new Date() } });
};

// Static method to find valid OTP
OTPSchema.statics.findValidOTP = async function(email: string, otp: string) {
  return this.findOne({
    email,
    otp,
    isUsed: false,
    expires: { $gt: new Date() }
  });
};

// Instance method to mark as used
OTPSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

// Instance method to increment attempts
OTPSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

export default mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);

