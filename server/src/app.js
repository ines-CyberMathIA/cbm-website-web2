import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import childrenRoutes from './routes/childrenRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import initializeMessageSocket from './socket/messageHandler.js';
import corsConfig from './config/corsConfig.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = initializeMessageSocket(httpServer);

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration CORS détaillée
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Appliquer CORS globalement
app.use(cors(corsOptions));

// Activer pre-flight pour toutes les routes
app.options('*', cors(corsOptions));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/messages', messageRoutes);

// Route de test CORS
app.options('*', cors(corsConfig));
app.get('/api/test-cors', cors(corsConfig), (req, res) => {
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
    
    httpServer.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log('Socket.IO initialisé');
    });

  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Gestionnaire pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    message: 'Route non trouvée'
  });
});

startServer();

export { app, io }; 