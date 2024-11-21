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
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin_cybermathia' });
    console.log('Admin existant:', existingAdmin);

    // Supprimer l'ancien compte admin
    const deleteResult = await User.deleteOne({ email: 'admin_cybermathia' });
    console.log('Résultat de la suppression:', deleteResult);

    // Hasher le mot de passe manuellement
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!@#', salt);
    console.log('Mot de passe hashé:', hashedPassword);

    // Créer le nouvel admin directement dans la base de données
    const result = await User.collection.insertOne({
      firstName: 'Admin',
      lastName: 'CyberMathIA',
      email: 'admin_cybermathia',
      password: hashedPassword,
      role: 'admin',
      notificationEmail: 'admin@cybermathia.com',
      createdAt: new Date()
    });

    console.log('Résultat de l\'insertion:', result);

    // Vérifier que le compte a bien été créé
    const verifiedAdmin = await User.findOne({ email: 'admin_cybermathia' });
    console.log('Vérification finale:', {
      found: !!verifiedAdmin,
      email: verifiedAdmin?.email,
      role: verifiedAdmin?.role,
      hashedPassword: verifiedAdmin?.password,
      passwordMatch: await bcrypt.compare('Admin123!@#', verifiedAdmin?.password)
    });

    // Test de connexion
    const testLogin = await User.findOne({ 
      email: 'admin_cybermathia',
      role: 'admin'
    });
    console.log('Test de connexion:', {
      found: !!testLogin,
      email: testLogin?.email,
      role: testLogin?.role,
      passwordValid: testLogin ? await bcrypt.compare('Admin123!@#', testLogin.password) : false
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    process.exit(1);
  }
};

resetAdmin(); 