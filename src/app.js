const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth_routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const frontendUrl = process.env.FRONTEND_URL_xd;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/logros', require('./routes/logros_routes'));
app.use('/api/niveles', require('./routes/niveles_routes'));
app.use('/api/configuracion', require('./routes/configuracion_routes'));

app.use('/api/roles', require('./routes/roles_routes'));
app.use('/api/servicios', require('./routes/servicios_routes'));
app.use('/api/usuarios', require('./routes/usuarios_routes'));

app.use('/api/checkpoint', require('./routes/checkpoint_routes'));

app.get('/', (req, res) => {
  res.json({ message: 'API de El Camino del Humedal' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;