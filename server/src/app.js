import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';

dotenv.config();

const app = express();

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration CORS spécifique
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Appliquer CORS à toutes les routes
app.use(cors(corsOptions));

// Middleware pour les erreurs CORS
app.use((err, req, res, next) => {
  if (err.name === 'CORSError') {
    console.error('Erreur CORS:', err);
    res.status(500).json({ 
      message: 'Erreur CORS',
      error: err.message 
    });
  } else {
    next(err);
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/teacher', teacherRoutes);

// Route de test CORS
app.options('*', cors(corsOptions));
app.get('/api/test-cors', cors(corsOptions), (req, res) => {
  res.json({ message: 'CORS test successful' });
});

// Connection MongoDB
const connectDB = async () => {
  try {
    console.log('Tentative de connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB avec succès');
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err);
    process.exit(1);
  }
};

// Démarrer le serveur
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    
    const server = app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log('Environnement:', process.env.NODE_ENV);
      console.log('CORS Origin:', corsOptions.origin);
    });

    // Gestion des erreurs du serveur
    server.on('error', (error) => {
      console.error('Erreur du serveur:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Le port ${PORT} est déjà utilisé`);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

export default app; 