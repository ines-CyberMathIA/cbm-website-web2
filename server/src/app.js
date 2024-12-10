import express from 'express';
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

dotenv.config();

const app = express();

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration CORS simplifiée
const corsOptions = {
  origin: 'http://localhost:3000',  // Uniquement HTTP
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Appliquer CORS avec les options
app.use(cors(corsOptions));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/messages', messageRoutes);

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