import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  bookmarks: { type: [String], default: [] },
  quizAttempts: [{
    quizId: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
    completedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('User', userSchema);
