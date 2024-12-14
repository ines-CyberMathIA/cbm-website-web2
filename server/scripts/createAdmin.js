import mongoose from 'mongoose';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtenir le chemin absolu du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis le bon chemin
dotenv.config({ path: join(__dirname, '../.env') });

const createAdminUser = async () => {
  try {
    console.log('Tentative de connexion à MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB avec succès');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@cybermathia.com' });
    if (existingAdmin) {
      console.log('Le compte admin existe déjà');
      process.exit(0);
    }

    // Créer le compte admin
    const hashedPassword = await bcrypt.hash('Admin123!@#', 10);
    const admin = new User({
      firstName: 'Admin',
      lastName: 'CyberMathIA',
      email: 'admin@cybermathia.com',
      notificationEmail: 'admin@cybermathia.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('Compte admin créé avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création du compte admin:', error);
    process.exit(1);
  }
};

createAdminUser(); 