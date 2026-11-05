const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth_routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const frontendUrl = process.env.FRONTEND_URL;

app.use(helmet());
app.use(cors({ origin: frontendUrl }));


// el backend solamente va recibir peticiones de nuestro  frotnend

app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API de El Camino del Humedal' });
});

app.use(notFound);
app.use(errorHandler);

app.listen(3000, () => {
  console.log(`API escuchando en http://localhost:${3000}`);
});

module.exports = app;
