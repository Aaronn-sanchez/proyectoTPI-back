# API backend — El Camino del Humedal

Backend REST inicial del proyecto TPI, construido con Node.js, Express y MySQL.

## Requisitos

- Node.js (versión LTS recomendada)
- MySQL en ejecución

## Instalación y ejecución

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` como `.env` y completar los datos locales de MySQL.
3. Iniciar en desarrollo: `npm run dev`
4. Iniciar normalmente: `npm start`

La API queda disponible en `http://localhost:3000` por defecto.

## Endpoint inicial

- `GET /api/health`: comprueba que la API responde y consulta la conexión a MySQL. Devuelve HTTP 200 si ambos servicios están disponibles y HTTP 503 si la base de datos no responde.

## Estructura inicial

- `src/app.js`: configuración de Express y middleware.
- `src/server.js`: inicio del servidor HTTP.
- `src/config/database.js`: pool de conexiones MySQL.
- `src/routes/`: rutas de la API.
- `src/middleware/`: manejo común de errores y rutas inexistentes.

Las credenciales reales deben mantenerse en `.env` y nunca subirse al repositorio. `.env.example` contiene solo nombres de variables y valores ilustrativos.
