require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const { TOKEN_SECRET } = process.env;
const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const ROL_USUARIO = 1;
const ROL_QA = Number(process.env.ROL_QA) || 2;

// Hash falso para que el login tarde lo mismo cuando el email no existe
const DUMMY_HASH = bcrypt.hashSync('dummy-password', ROUNDS);

function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

function crearToken(usuario) {
    return jwt.sign(usuario, TOKEN_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRES_IN || '15m',
    });
}

// Arma la respuesta igual para registro y login
function armarRespuesta(usuario) {
    return {
        usuario,
        esQA: usuario.rol === ROL_QA,
        token: crearToken(usuario),
    };
}

async function register(nombre, email, password) {
    const passwordHash = await bcrypt.hash(password, ROUNDS);

    try {
        // El registro SIEMPRE crea usuarios comunes
        const [result] = await db.execute(
            `INSERT INTO USUARIOS (email, password_hash, id_rol, nombre_usuario)
             VALUES (?, ?, ?, ?)`,
            [email, passwordHash, ROL_USUARIO, nombre]
        );

        return armarRespuesta({ id: result.insertId, nombre, email, rol: ROL_USUARIO });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw crearError(409, 'El email ya está registrado');
        }
        throw error;
    }
}

async function login(email, password) {
    const [rows] = await db.execute(
        `SELECT id_usuario, nombre_usuario, email, password_hash, id_rol
         FROM USUARIOS WHERE email = ?`,
        [email]
    );
    const user = rows[0];

    const valido = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !valido) {
        throw crearError(401, 'Credenciales inválidas');
    }

    return armarRespuesta({
        id: user.id_usuario,
        nombre: user.nombre_usuario,
        email: user.email,
        rol: user.id_rol,   // <- el rol sale de la base de datos
    });
}

module.exports = { register, login };