import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    portfolioId: {
        type: Number,
        required: true,
        index: true
    },
    authorEmail: {
        type: String,
        required: true,
        index: true
    },
    authorName: {
        type: String,
        required: true
    },
    authorRole: {
        type: String,
        required: true,
        enum: ['user', 'company', 'admin', 'teacher']
    },
    content: {
        type: String,
        required: true,
        maxlength: 500
    }
}, {
    timestamps: true,
    collection: 'comments'
});

// Index for efficient queries
commentSchema.index({ portfolioId: 1, authorEmail: 1 });

// ป้องกัน OverwriteModelError เวลา hot reload (ใช้ pattern แบบเดียวกับ Portfolio)
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;
