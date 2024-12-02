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
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Le document s'auto-supprime après 24h
  }
});

// Ajouter un index composé sur firstName et lastName
pendingTeacherSchema.index({ firstName: 1, lastName: 1 }, { unique: true });

// Méthode statique pour vérifier un token
pendingTeacherSchema.statics.findByToken = async function(token) {
  try {
    const pendingTeacher = await this.findOne({ token });
    if (!pendingTeacher) return null;

    // Vérifier si l'invitation n'a pas expiré
    const now = new Date();
    const expiryDate = new Date(pendingTeacher.createdAt.getTime() + 24*60*60*1000);
    if (now > expiryDate) {
      await this.deleteOne({ _id: pendingTeacher._id });
      return null;
    }

    return pendingTeacher;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
};

// Ajouter une méthode statique pour vérifier l'existence
pendingTeacherSchema.statics.checkExistingTeacher = async function(firstName, lastName) {
  // Vérifier dans PendingTeacher
  const pendingTeacher = await this.findOne({ 
    firstName: new RegExp(`^${firstName}$`, 'i'),
    lastName: new RegExp(`^${lastName}$`, 'i')
  });

  if (pendingTeacher) {
    return {
      exists: true,
      type: 'pending',
      data: pendingTeacher
    };
  }

  // Vérifier dans User (professeurs actifs)
  const existingTeacher = await mongoose.model('User').findOne({
    firstName: new RegExp(`^${firstName}$`, 'i'),
    lastName: new RegExp(`^${lastName}$`, 'i'),
    role: 'teacher'
  });

  if (existingTeacher) {
    return {
      exists: true,
      type: 'active',
      data: existingTeacher
    };
  }

  return { exists: false };
};

export default mongoose.model('PendingTeacher', pendingTeacherSchema); 