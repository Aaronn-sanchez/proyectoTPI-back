require('dotenv').config();

const app = require('./app');
const pool = require('./config/database');

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});

function cerrarServidor(signal) {
  console.log(`\n${signal}: cerrando servidor...`);
  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error('Error al cerrar el pool de MySQL:', error.message);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => cerrarServidor('SIGINT'));
process.on('SIGTERM', () => cerrarServidor('SIGTERM'));
