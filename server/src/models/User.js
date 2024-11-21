import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  login: {
    type: String,
    unique: true,
    sparse: true // Permet d'avoir des valeurs null pour les non-élèves
  },
  email: {
    type: String,
    required: function() { 
      return this.role !== 'student';
    },
    unique: true,
    sparse: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'parent', 'student', 'manager'],
    required: true
  },
  speciality: {
    type: String,
    enum: ['mathematics', 'physics', 'chemistry', 'biology', 'computer_science'],
    required: function() { return this.role === 'teacher'; }
  },
  level: [{
    type: String,
    enum: ['6eme', '5eme', '4eme', '3eme', '2nde', '1ere', 'terminale'],
    required: function() { return this.role === 'student'; }
  }],
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.role === 'student'; }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  twoFactorCode: {
    type: String,
    default: null
  },
  notificationEmail: {
    type: String,
    required: function() { return this.role === 'admin'; }
  }
});

// Fonction pour générer un login unique
async function generateUniqueLogin(firstName, lastName) {
  // Nettoyer et formater le prénom et le nom
  const cleanFirstName = firstName.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, '');
  
  const cleanLastName = lastName.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, '');

  // Base du login : première lettre du prénom + nom
  let baseLogin = `${cleanFirstName.charAt(0)}${cleanLastName}`;
  let login = baseLogin;
  let counter = 1;

  // Vérifier si le login existe déjà
  while (await mongoose.model('User').findOne({ login })) {
    login = `${baseLogin}${counter}`;
    counter++;
  }

  return login;
}

// Middleware pre-save pour générer le login des élèves
userSchema.pre('save', async function(next) {
  try {
    // Générer un login uniquement pour les nouveaux élèves
    if (this.isNew && this.role === 'student' && !this.login) {
      this.login = await generateUniqueLogin(this.firstName, this.lastName);
      console.log('Login généré pour l\'élève:', this.login);
    }

    // Hash le mot de passe si modifié
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparaison des mots de passe:');
    console.log('- Mot de passe stocké (hash):', this.password);
    console.log('- Mot de passe candidat:', candidatePassword);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('- Résultat de la comparaison:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Erreur lors de la comparaison des mots de passe:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);
export default User; 