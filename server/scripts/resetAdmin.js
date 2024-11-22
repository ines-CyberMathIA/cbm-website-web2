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
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');
    
    // Supprimer l'ancien compte admin s'il existe
    await User.deleteMany({ role: 'admin' });
    console.log('Anciens comptes admin supprimés');

    // Créer le mot de passe hashé une seule fois
    const password = 'Admin123!@#';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer le nouvel admin avec le mot de passe hashé
    const admin = new User({
      firstName: 'Admin',
      lastName: 'CyberMathIA',
      email: 'admin_cybermathia',
      notificationEmail: 'admin@cybermathia.com',
      password: hashedPassword, // Utiliser directement le mot de passe hashé
      role: 'admin'
    });

    // Sauvegarder l'admin sans re-hasher le mot de passe
    const savedAdmin = await User.collection.insertOne(admin);
    console.log('Compte admin créé avec succès:', {
      login: admin.email,
      notificationEmail: admin.notificationEmail,
      role: admin.role,
      hashedPassword: admin.password
    });

    // Test de connexion immédiat
    const testLogin = await User.findOne({ 
      email: 'admin_cybermathia',
      role: 'admin'
    });
    
    if (testLogin) {
      const isValidPassword = await bcrypt.compare(password, testLogin.password);
      console.log('Test de connexion:', {
        loginFound: true,
        passwordValid: isValidPassword,
        storedHash: testLogin.password,
        notificationEmail: testLogin.notificationEmail
      });

      if (!isValidPassword) {
        console.error('ERREUR: Le test de mot de passe a échoué!');
        process.exit(1);
      }
    }

    console.log('Compte admin créé et vérifié avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

resetAdmin(); 