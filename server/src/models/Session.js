import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  level: { type: String, required: true },
  maxStudents: { 
    type: Number, 
    default: 4,
    max: 4 
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'in-progress', 'completed'],
    default: 'open'
  },
  homework: [{
    title: String,
    description: String,
    dueDate: Date,
    submissions: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      submittedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'completed', 'late'],
        default: 'pending'
      }
    }]
  }],
  sessionReport: {
    content: String,
    createdAt: Date,
    attendance: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      present: Boolean
    }]
  }
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema); 