const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const healthRoutes = require('./routes/health_routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
/* const authRoutes = require('./routes/auth.routes'); */

const app = express();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: frontendUrl }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', healthRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API de El Camino del Humedal' });
});

app.use('/api/health', healthRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(3000, () => {
  console.log(`API escuchando en http://localhost:${3000}`);
});

module.exports = app;
