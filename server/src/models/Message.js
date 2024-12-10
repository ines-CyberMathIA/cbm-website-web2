import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageChannel',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index pour rechercher rapidement les messages d'un canal
messageSchema.index({ channel: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);