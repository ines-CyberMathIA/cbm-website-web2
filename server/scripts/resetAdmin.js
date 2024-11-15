import mongoose from 'mongoose';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');
    
    // Supprimer l'ancien compte admin
    await User.deleteOne({ email: 'admin@cybermathia.com' });
    console.log('Ancien compte admin supprimé');

    // Créer un nouveau compte admin avec le mot de passe non hashé
    const admin = new User({
      firstName: 'Admin',
      lastName: 'CyberMathIA',
      email: 'admin@cybermathia.com',
      password: 'Admin123!@#',  // Le modèle User hashera automatiquement le mot de passe
      role: 'admin'
    });

    await admin.save();
    console.log('Nouveau compte admin créé');

    // Vérifier que le compte a bien été créé
    const savedAdmin = await User.findOne({ email: 'admin@cybermathia.com' });
    console.log('Compte admin vérifié:', {
      email: savedAdmin.email,
      role: savedAdmin.role,
      passwordHash: savedAdmin.password.substring(0, 10) + '...'
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

resetAdmin(); 