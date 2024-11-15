const managerMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    next();
  } else {
    res.status(403).json({ message: 'Accès réservé aux managers' });
  }
};

export default managerMiddleware; 