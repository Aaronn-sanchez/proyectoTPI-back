require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const { TOKEN_SECRET } = process.env;
const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const ROL_USUARIO = Number(process.env.ROL_USUARIO) || 1;
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

function armarRespuesta(usuario) {
    return {
        usuario,
        esQA: usuario.roles.includes(ROL_QA),
        token: crearToken(usuario),
    };
}

async function register(nombre, email, password) {
    const passwordHash = await bcrypt.hash(password, ROUNDS);
    const conn = await db.getConnection();

    try {
        // Usuario y rol se guardan juntos: si algo falla, no queda nada a medias
        await conn.beginTransaction();

        const [result] = await conn.execute(
            'INSERT INTO USUARIOS (email, password_hash, nombre_usuario) VALUES (?, ?, ?)',
            [email, passwordHash, nombre]
        );
        await conn.execute(
            'INSERT INTO USUARIO_ROLES (id_usuario, id_rol) VALUES (?, ?)',
            [result.insertId, ROL_USUARIO]
        );

        await conn.commit();
        return armarRespuesta({ id: result.insertId, nombre, email, roles: [ROL_USUARIO] });
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            throw crearError(409, 'El email ya está registrado');
        }
        throw error;
    } finally {
        conn.release();
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

    const [filasRoles] = await db.execute(
        'SELECT id_rol FROM USUARIO_ROLES WHERE id_usuario = ?',
        [user.id_usuario]
    );

    return armarRespuesta({
        id: user.id_usuario,
        nombre: user.nombre_usuario,
        email: user.email,
        roles: filasRoles.map((f) => f.id_rol),
    });
}

module.exports = { register, login };