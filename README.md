# Cozzy & Cosso — Backend (API REST)

API del videojuego **Cozzy & Cosso**, un juego web 2D de plataformas y acertijos con un carpincho y un benteveo. Maneja cuentas, roles y permisos, progreso de niveles, partidas guardadas (checkpoints), logros y configuración de cada jugador.

> Trabajo de la **Trayectoria Pedagógica Interdisciplinaria (TPI)** — Técnico en Programación, Colegio Olga Bronzovich de Arko, 7°1, 2026.
> **Autores:** Solange Katherina Montaño Rodríguez y Aarón Alexander Sanchez.
> **Docentes:** Thiago Pizarro, Damián Greco y Antonella Valle.

Este repositorio es solo el **servidor**. El juego (cliente web) está en el repositorio del frontend.

---

## Tecnologías

Node.js · Express 5 · MySQL (`mysql2`) · JWT · bcrypt · Zod · Helmet · CORS

---

## Guía de instalación

### 1. Requisitos previos

Instalá estos programas si todavía no los tenés:

| Programa | Versión recomendada | Para qué sirve |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20 LTS o superior | Ejecutar el servidor (incluye `npm`) |
| [MySQL Server](https://dev.mysql.com/downloads/mysql/) | 8.0 o superior | Base de datos |
| [Git](https://git-scm.com/) | Cualquiera | Descargar el proyecto |

Para comprobar que quedaron instalados:

```bash
node -v
npm -v
mysql --version
git --version
```

### 2. Descargar el proyecto

```bash
git clone <URL-DE-ESTE-REPOSITORIO>
cd <carpeta-del-proyecto>
```

### 3. Instalar las dependencias

```bash
npm install
```

Esto crea la carpeta `node_modules/` con todas las librerías que figuran en `package.json`.

### 4. Crear la base de datos

1. Entrá a MySQL desde la terminal (te pide la contraseña que elegiste al instalarlo):
   ```bash
   mysql -u root -p
   ```
2. Creá la base de datos:
   ```sql
   CREATE DATABASE cozzy_cosso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```
3. Importá las tablas con el script del proyecto:
   ```bash
   mysql -u root -p cozzy_cosso < database/schema.sql
   ```

> Si preferís una interfaz gráfica, podés abrir `database/schema.sql` en **MySQL Workbench** y ejecutarlo sobre la base `cozzy_cosso`.

La API usa estas tablas: `USUARIOS`, `ROLES`, `USUARIO_ROLES`, `SERVICIOS`, `ROL_SERVICIOS`, `PROGRESO_NIVELES`, `CHECKPOINTS_ESTADO`, `CONFIGURACION_PERFILES`, `CATALOGO_LOGROS` y `USUARIO_LOGROS`.

#### Datos iniciales obligatorios

Para que el registro y los permisos funcionen, la base necesita al menos estos datos (si tu `schema.sql` ya los incluye, saltá este paso):

```sql
-- Roles de sistema: el 1 es Jugador y el 2 es QA Tester
INSERT INTO ROLES (id_rol, nombre_rol, es_sistema) VALUES
  (1, 'Jugador', 1),
  (2, 'QA Tester', 1);

-- Servicios (permisos) que usa la API
INSERT INTO SERVICIOS (clave, descripcion) VALUES
  ('gestionar_roles', 'Crear y administrar roles y usuarios'),
  ('desbloquear_niveles', 'Acceder a todos los niveles sin restricciones');

-- Le damos esos permisos al rol QA Tester
INSERT INTO ROL_SERVICIOS (id_rol, id_servicio)
  SELECT 2, id_servicio FROM SERVICIOS;
```

### 5. Configurar las variables de entorno

Creá un archivo llamado `.env` en la **raíz del proyecto** (al lado de `package.json`) con este contenido, cambiando los valores por los tuyos:

```env
# Servidor
PORT=3000

# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_contraseña_de_mysql
DB_NAME=cozzy_cosso

# Autenticación
TOKEN_SECRET=una_clave_larga_y_secreta
TOKEN_EXPIRES_IN=2h
BCRYPT_ROUNDS=10

# IDs de los roles en la tabla ROLES
ROL_USUARIO=1
ROL_QA=2

# ID del último nivel (tutorial = 0 + 4 niveles => 4)
TOTAL_NIVELES=4
```

| Variable | Descripción | Obligatoria |
|---|---|---|
| `PORT` | Puerto del servidor (por defecto `3000`) | No |
| `DB_HOST` | Dirección de MySQL | Sí |
| `DB_USER` | Usuario de MySQL | Sí |
| `DB_PASS` | Contraseña de MySQL | Sí |
| `DB_NAME` | Nombre de la base de datos | Sí |
| `TOKEN_SECRET` | Clave con la que se firman los tokens JWT | Sí |
| `TOKEN_EXPIRES_IN` | Duración del token (`2h`, `7d`, etc.) | Sí |
| `BCRYPT_ROUNDS` | Rondas de encriptado de contraseñas (por defecto `10`) | No |
| `ROL_USUARIO` | ID del rol Jugador (por defecto `1`) | No |
| `ROL_QA` | ID del rol QA Tester (por defecto `2`) | No |
| `TOTAL_NIVELES` | ID del último nivel | Sí |

> ⚠️ El archivo `.env` contiene datos privados. **Nunca lo subas a GitHub** (verificá que esté en `.gitignore`).

### 6. Iniciar el servidor

Modo desarrollo (se reinicia solo al guardar cambios):

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

Si todo salió bien, la terminal muestra:

```
API escuchando en http://localhost:3000
```

### 7. Comprobar que funciona

Abrí en el navegador `http://localhost:3000/`. Tendría que aparecer:

```json
{ "message": "API de El Camino del Humedal" }
```

Después, levantá el [frontend](#) apuntando a esta dirección para jugar.

### 8. Crear un usuario QA Tester (opcional)

El rol QA Tester **no se puede elegir al registrarse**: lo asigna el equipo de desarrollo desde la base de datos.

1. Registrá una cuenta normal desde el juego.
2. Buscá su ID y asignale el rol 2:
   ```sql
   SELECT id_usuario, email FROM USUARIOS;
   INSERT INTO USUARIO_ROLES (id_usuario, id_rol) VALUES (1, 2);  -- cambiá el 1 por el ID real
   ```
3. Cerrá sesión y volvé a entrar para que se actualicen los permisos.

---

## Problemas frecuentes

| Problema | Causa y solución |
|---|---|
| `TOTAL_NIVELES inválido o ausente en el .env` | Falta esa variable en el `.env` o no es un número mayor o igual a 1. |
| `ER_ACCESS_DENIED_ERROR` | Usuario o contraseña de MySQL incorrectos en `DB_USER` / `DB_PASS`. |
| `ER_BAD_DB_ERROR` | La base de datos no existe o `DB_NAME` está mal escrito. |
| `ECONNREFUSED` | MySQL no está encendido. Iniciá el servicio de MySQL. |
| `Table '...' doesn't exist` | Falta importar `database/schema.sql`. |
| `EADDRINUSE` | El puerto ya está ocupado. Cambiá `PORT` en el `.env`. |
| `secretOrPrivateKey must have a value` | Falta `TOKEN_SECRET` en el `.env`. |
| Los cambios del `.env` no se aplican | Reiniciá el servidor. |

---

## Estructura del proyecto

```
src/
├── app.js            # Configuración de Express y montaje de rutas
├── server.js         # Inicio del servidor y cierre ordenado
├── config/           # Conexión a MySQL (pool de conexiones)
├── routes/           # Rutas de cada módulo
├── controllers/      # Validación de datos (Zod) y respuesta HTTP
├── services/         # Lógica de negocio y consultas SQL
└── middleware/       # auth (JWT), requiereServicio (permisos), errores y 404
postman/              # Workspace de Postman para probar la API
```

La arquitectura separa **rutas → controladores → servicios**.

---

## Referencia de la API

Todas las rutas empiezan con `/api`. Salvo registro y login, **requieren** el header:

```
Authorization: Bearer <token>
```

El token se obtiene al registrarse o iniciar sesión.

### Auth — `/api/auth`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/register` | Crea una cuenta (rol Jugador) y devuelve el token |
| POST | `/login` | Inicia sesión |
| GET | `/me` | Datos del usuario autenticado |
| PATCH | `/me` | Cambia el nombre de usuario |
| DELETE | `/me` | Da de baja la cuenta |
| GET | `/qa/check` | Verifica acceso QA |

### Niveles — `/api/niveles`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Estado de todos los niveles y nivel actual |
| POST | `/iniciar` | Registra que se entró a un nivel (valida que esté desbloqueado) |
| POST | `/completar` | Marca un nivel como completado |

### Partidas guardadas — `/api/checkpoint`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/?nivel=0` | Lista los guardados del nivel (máximo 5 por nivel) |
| GET | `/ultimo?nivel=0` | Guardado más reciente del nivel |
| GET | `/:id` | Un guardado completo (posición y estado de objetos) |
| POST | `/` | Crea un guardado |
| PUT | `/:id` | Reescribe un guardado |
| DELETE | `/:id` | Borra un guardado |

### Configuración — `/api/configuracion`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Configuración actual y perfiles |
| PATCH | `/` | Cambia volumen de música o idioma |
| POST | `/perfiles` | Crea un perfil (máximo 3) |
| POST | `/perfiles/:id/aplicar` | Activa un perfil |
| DELETE | `/perfiles/:id` | Borra un perfil |

### Logros — `/api/logros`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Catálogo de logros con el progreso del jugador |
| POST | `/progreso` | Suma progreso a un logro |

### Roles, servicios y usuarios (requieren el servicio `gestionar_roles`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/servicios` | Lista los servicios disponibles |
| GET / POST | `/api/roles` | Lista / crea roles |
| GET / PUT / DELETE | `/api/roles/:id` | Detalle / renombra / elimina un rol |
| PUT / POST | `/api/roles/:id/servicios` | Reemplaza / agrega servicios de un rol |
| DELETE | `/api/roles/:id/servicios/:idServicio` | Quita un servicio de un rol |
| GET | `/api/usuarios` | Lista los usuarios activos |
| GET / POST | `/api/usuarios/:id/roles` | Ve / asigna roles de un usuario |
| DELETE | `/api/usuarios/:id/roles/:idRol` | Quita un rol a un usuario |
| DELETE | `/api/usuarios/:id` | Deshabilita una cuenta |

---

## Seguridad

- Contraseñas guardadas con hash (bcrypt); nunca se devuelven en las respuestas.
- Consultas SQL parametrizadas contra inyección.
- Validación de todos los datos de entrada con Zod.
- Cada jugador solo accede a su propio progreso, guardados, configuración y logros.
- Los roles los asigna el servidor, nunca el cliente.
- Los roles de sistema (Jugador y QA Tester) no se pueden modificar desde la API.