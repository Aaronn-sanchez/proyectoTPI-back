require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const { TOKEN_SECRET } = process.env;
const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;


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

async function register(nombre, email, password) {
    const passwordHash = await bcrypt.hash(password, ROUNDS);

    try {
        const [result] = await db.execute(
            `INSERT INTO USUARIOS (email, password_hash, id_rol, nombre_usuario)
             VALUES (?, ?, 1, ?)`,
            [email, passwordHash, nombre]
        );

        const usuario = { id: result.insertId, nombre, email };
        return { usuario, token: crearToken(usuario) };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw crearError(409, 'El email ya está registrado');
        }
        throw error;
    }
}

async function login(email, password) {
    const [rows] = await db.execute(
        `SELECT id_usuario, nombre_usuario, email, password_hash
         FROM USUARIOS WHERE email = ?`,
        [email]
    );
    const user = rows[0];

    const valido = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !valido) {
        throw crearError(401, 'Credenciales inválidas');
    }

    const usuario = { id: user.id_usuario, nombre: user.nombre_usuario, email: user.email };
    return { usuario, token: crearToken(usuario) };
}

module.exports = { register, login };