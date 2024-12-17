import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    console.log('Headers reçus:', req.headers);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({ 
      message: 'Erreur d\'authentification',
      error: error.message 
    });
  }
};

export default authMiddleware; 