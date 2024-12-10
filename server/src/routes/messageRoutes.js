router.get('/manager', authMiddleware, async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id).populate('managerId');
    if (!teacher.managerId) {
      return res.status(404).json({ message: "Aucun manager n'est assigné" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: teacher.managerId._id },
        { senderId: teacher.managerId._id, receiverId: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      content: msg.content,
      createdAt: msg.createdAt,
      sender: msg.senderId.equals(req.user.id) ? 'teacher' : {
        id: teacher.managerId._id,
        role: 'manager',
        firstName: teacher.managerId.firstName,
        lastName: teacher.managerId.lastName
      }
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}); 