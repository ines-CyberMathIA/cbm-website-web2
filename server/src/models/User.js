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
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Champs spécifiques par rôle
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
    }
  }
}, { 
  timestamps: true 
});

// Middleware pour hasher le mot de passe avant la sauvegarde
userSchema.pre('save', async function(next) {
  try {
    // Ne hash le mot de passe que s'il a été modifié
    if (!this.isModified('password')) {
      return next();
    }

    // Générer un salt
    const salt = await bcrypt.genSalt(10);
    // Hasher le mot de passe avec le salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Méthode pour nettoyer l'objet utilisateur avant de l'envoyer au client
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User; 