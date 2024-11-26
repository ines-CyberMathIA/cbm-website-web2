import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    // Vérifier le format du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Format du header Authorization invalide:', authHeader);
      return res.status(401).json({ message: 'Format d\'authentification invalide' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token reçu:', token);

    if (!token) {
      console.log('Pas de token fourni');
      return res.status(401).json({ message: 'Authentification requise' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé avec succès:', decoded);
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error('Erreur de vérification JWT:', jwtError);
      return res.status(401).json({ message: 'Token invalide' });
    }
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({ message: 'Erreur d\'authentification' });
  }
};

export default authMiddleware; 