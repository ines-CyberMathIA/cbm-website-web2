import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    console.log('=== Début de la vérification d\'authentification ===');
    console.log('Headers reçus:', req.headers);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Header d\'autorisation invalide:', authHeader);
      return res.status(401).json({ message: 'Format d\'authentification invalide' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extrait:', token ? token.substring(0, 20) + '...' : 'null');

    try {
      console.log('Tentative de vérification du token avec secret:', process.env.JWT_SECRET ? 'présent' : 'manquant');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé avec succès:', {
        userId: decoded.userId,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp
      });

      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
      console.log('User ajouté à la requête:', req.user);
      console.log('=== Fin de la vérification d\'authentification ===');
      next();
    } catch (jwtError) {
      console.error('Erreur de vérification JWT:', {
        name: jwtError.name,
        message: jwtError.message,
        expiredAt: jwtError.expiredAt
      });
      return res.status(401).json({ 
        message: 'Token invalide',
        details: jwtError.message
      });
    }
  } catch (error) {
    console.error('Erreur générale d\'authentification:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(401).json({ 
      message: 'Erreur d\'authentification',
      details: error.message
    });
  }
};

export default authMiddleware; 