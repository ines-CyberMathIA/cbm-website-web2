const express = require('express');
const cors = require('cors');
const app = express();

// Configuration CORS
app.use(cors({
  origin: 'http://localhost:3000', // L'URL de votre client React
  credentials: true // Nécessaire si vous utilisez des cookies/sessions
}));

// Le reste de votre code...

// Ajoutez à la fin du fichier :
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});