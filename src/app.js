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

app.use(notFound);
app.use(errorHandler);
app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
});

module.exports = app;