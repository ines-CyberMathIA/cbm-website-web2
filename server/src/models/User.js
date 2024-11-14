import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  role: { 
    type: String, 
    required: true, 
    enum: ['admin', 'recruiter', 'parent', 'student', 'teacher'] 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  // Champs spécifiques par rôle
  adminFields: {
    twoFactorSecret: String,
    lastLogin: Date
  },
  teacherFields: {
    subjects: [String],
    levels: [String],
    rib: {
      iban: String,
      bic: String
    },
    availableSlots: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    }]
  },
  parentFields: {
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    stripeCustomerId: String
  },
  studentFields: {
    level: String,
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sessions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    }]
  }
}, { 
  timestamps: true,
  discriminatorKey: 'role' 
});

// Méthode pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export default mongoose.model('User', userSchema); 