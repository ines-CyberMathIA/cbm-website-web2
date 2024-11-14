import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();

// Middleware avec logs détaillés
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Connection MongoDB avec plus de logs et gestion d'erreurs
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connecté à MongoDB avec succès');
    console.log('URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'));
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err);
    process.exit(1);
  }
};

connectDB();

const db = mongoose.connection;
db.on('error', (err) => {
  console.error('Erreur MongoDB:', err);
});
db.once('open', () => {
  console.log('Base de données prête');
  // Afficher les collections existantes
  db.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Erreur lors de la liste des collections:', err);
    } else {
      console.log('Collections disponibles:', collections.map(c => c.name));
    }
  });
});

// Routes avec préfixe API et gestion d'erreurs
app.use('/api/users', (req, res, next) => {
  console.log('API Users Route:', req.method, req.url);
  next();
}, userRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing'
    }
  });
});

// Gestion des erreurs améliorée
app.use((err, req, res, next) => {
  console.error('=== Erreur Serveur ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Body:', req.body);
  console.error('Query:', req.query);
  console.error('Params:', req.params);
  console.error('===================');

  res.status(err.status || 500).json({
    message: err.message || 'Une erreur est survenue!',
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      details: err.details || {}
    } : undefined
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  console.log(`Route non trouvée: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route non trouvée' });
});

// Vérification des variables d'environnement requises
console.log('=== Vérification des variables d\'environnement ===');
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET n\'est pas défini !');
  process.exit(1);
}
console.log('JWT_SECRET est défini:', process.env.JWT_SECRET.substring(0, 5) + '...');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=== Configuration du Serveur ===`);
  console.log(`Port: ${PORT}`);
  console.log('Environnement:', process.env.NODE_ENV);
  console.log('MongoDB URI configurée:', process.env.MONGODB_URI ? 'Oui' : 'Non');
  console.log('JWT Secret configuré:', process.env.JWT_SECRET ? 'Oui' : 'Non');
  console.log('JWT Secret length:', process.env.JWT_SECRET?.length);
  console.log('============================');
});

export default app; 