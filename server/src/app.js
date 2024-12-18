import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

// Configuration CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Configuration Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware Socket.IO pour l'authentification
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      throw new Error('Token manquant');
    }
    // Vérification du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    console.error('Erreur authentification socket:', error);
    next(new Error('Authentification échouée'));
  }
});

// Gestionnaire de connexion Socket.IO
io.on('connection', (socket) => {
  console.log('Nouvelle connexion socket:', socket.id);
  
  socket.on('join_channel', ({ channelId }) => {
    console.log(`Socket ${socket.id} rejoint le canal ${channelId}`);
    socket.join(channelId);
  });

  socket.on('disconnect', () => {
    console.log('Socket déconnecté:', socket.id);
  });
});

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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