import mongoose from 'mongoose';

const pendingTeacherSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  speciality: {
    type: String,
    enum: ['mathematics', 'physics', 'chemistry', 'biology', 'computer_science'],
    default: 'mathematics'
  },
  level: [{
    type: String,
    enum: ['college', 'lycee', 'superieur', 'adulte']
  }],
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Le document s'auto-supprime après 24h
  }
});

export default mongoose.model('PendingTeacher', pendingTeacherSchema); 