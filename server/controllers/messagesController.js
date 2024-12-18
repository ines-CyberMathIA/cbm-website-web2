const Channel = require('../models/Channel');

// Récupérer tous les canaux de l'utilisateur
const getChannels = async (req, res) => {
  try {
    console.log('🔍 Recherche des canaux pour l\'utilisateur:', req.user);
    const userId = req.user.userId;
    const userRole = req.user.role;

    let channels;
    if (userRole === 'manager') {
      channels = await Channel.find({
        $or: [
          { managerId: userId },
          { participants: userId }
        ]
      }).populate('participants', 'firstName lastName email');
    } else if (userRole === 'teacher') {
      channels = await Channel.find({
        participants: userId
      }).populate('managerId', 'firstName lastName email');
    }

    console.log('📦 Canaux trouvés:', channels);
    res.json(channels);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des canaux:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getChannels,
  // ... autres méthodes
};