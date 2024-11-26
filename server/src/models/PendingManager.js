import mongoose from 'mongoose';

const pendingManagerSchema = new mongoose.Schema({
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

export default mongoose.model('PendingManager', pendingManagerSchema); 