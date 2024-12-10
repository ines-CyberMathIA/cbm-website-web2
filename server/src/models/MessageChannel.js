import mongoose from 'mongoose';

const messageChannelSchema = new mongoose.Schema({
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    manager: {
      type: Number,
      default: 0
    },
    teacher: {
      type: Number,
      default: 0
    }
  }
}, { timestamps: true });

// Index pour rechercher rapidement les canaux d'un utilisateur
messageChannelSchema.index({ manager: 1, teacher: 1 });

export default mongoose.model('MessageChannel', messageChannelSchema);
