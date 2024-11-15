import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// Configuration CORS détaillée
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Connection MongoDB avec plus de logs et gestion d'erreurs
const connectDB = async () => {
  try {
    console.log('Tentative de connexion à MongoDB...');
    console.log('URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout après 5 secondes
    });
    
    console.log('Connecté à MongoDB avec succès');
    
    // Vérifier la connexion
    const adminDb = mongoose.connection.db.admin();
    const dbInfo = await adminDb.listDatabases();
    console.log('Bases de données disponibles:', dbInfo.databases.map(db => db.name));
    
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err);
    console.error('Détails de l\'erreur:', {
      message: err.message,
      code: err.code,
      name: err.name
    });
    process.exit(1);
  }
};

// Attendre que MongoDB soit prêt avant de démarrer le serveur
const startServer = async () => {
  try {
    await connectDB();
    
    // Routes
    app.use('/api/users', userRoutes);
    app.use('/api/admin', adminRoutes);
    
    // Route de test
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    });
    
    // Démarrer le serveur
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log('Environnement:', process.env.NODE_ENV);
    });
    
  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

export default app; 