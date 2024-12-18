import managerRoutes from './routes/manager.js';
const express = require('express');
const app = express();
const messagesRoutes = require('./routes/messages');

// ...

app.use('/api/manager', managerRoutes);
app.use('/api/messages', messagesRoutes);