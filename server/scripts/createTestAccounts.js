import mongoose from 'mongoose';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const createTestAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Créer un compte parent test
    const hashedPassword = await bcrypt.hash('Parent123!@#', 10);
    const parent = new User({
      firstName: 'Parent',
      lastName: 'Test',
      email: 'parent@test.com',
      password: hashedPassword,
      role: 'parent'
    });

    await parent.save();
    console.log('Compte parent test créé:', {
      email: parent.email,
      role: parent.role
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

createTestAccounts(); 