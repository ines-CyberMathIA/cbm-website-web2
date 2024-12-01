import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Format d\'authentification invalide' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
      next();
    } catch (jwtError) {
      return res.status(401).json({ message: 'Token invalide' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Erreur d\'authentification' });
  }
};

export default authMiddleware; 