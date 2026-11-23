require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const { TOKEN_SECRET } = process.env;
const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const ROL_USUARIO = Number(process.env.ROL_USUARIO) || 1;
const ROL_QA = Number(process.env.ROL_QA) || 2;

const DUMMY_HASH = bcrypt.hashSync('dummy-password', ROUNDS);

function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

function crearToken(usuario) {
    return jwt.sign(usuario, TOKEN_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRES_IN || '30m',
    });
}

function armarRespuesta(usuario) {
    return {
        usuario,
        esQA: usuario.roles.includes(ROL_QA),
        token: crearToken(usuario),
    };
}

async function obtenerRoles(idUsuario) {
    const [rows] = await db.execute(
        'SELECT id_rol FROM USUARIO_ROLES WHERE id_usuario = ?',
        [idUsuario]
    );
    return rows.map((r) => r.id_rol);
}

async function register(nombre, email, password) {
    const passwordHash = await bcrypt.hash(password, ROUNDS);
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [result] = await conn.execute(
            `INSERT INTO USUARIOS
             (email, password_hash, nombre_usuario, estado)
             VALUES (?, ?, ?, 1)`,
            [email, passwordHash, nombre]
        );

        await conn.execute(
            'INSERT INTO USUARIO_ROLES (id_usuario, id_rol) VALUES (?, ?)',
            [result.insertId, ROL_USUARIO]
        );

        await conn.commit();

        return armarRespuesta(armarUsuario(
            { id_usuario: result.insertId, nombre_usuario: nombre, email },
            [ROL_USUARIO]
        ));
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
        `SELECT id_usuario, nombre_usuario, email, password_hash, estado
         FROM USUARIOS WHERE email = ?`,
        [email]
    );

    const user = rows[0];
    const valido = await bcrypt.compare(
        password,
        user ? user.password_hash : DUMMY_HASH
    );

    if (!user || !valido) {
        throw crearError(401, 'Credenciales inválidas');
    }

    if (!user.estado) {
        throw crearError(403, 'La cuenta está inactiva');
    }

    const roles = await obtenerRoles(user.id_usuario);

    return armarRespuesta(armarUsuario(user, roles));
}

function armarUsuario(fila, roles) {
    return {
        id: fila.id_usuario,
        nombre: fila.nombre_usuario,
        email: fila.email,
        roles,
    };
}

async function actualizarNombre(idUsuario, nombre) {
    await db.execute(
        'UPDATE USUARIOS SET nombre_usuario = ? WHERE id_usuario = ?',
        [nombre, idUsuario]
    );

    const [rows] = await db.execute(
        'SELECT id_usuario, nombre_usuario, email FROM USUARIOS WHERE id_usuario = ?',
        [idUsuario]
    );

    if (!rows.length) {
        throw crearError(404, 'Usuario inexistente');
    }

    return armarRespuesta(
        armarUsuario(rows[0], await obtenerRoles(idUsuario))
    );
}

async function eliminarCuenta(idUsuario) {
    const [result] = await db.execute(
        'UPDATE USUARIOS SET estado = 0 WHERE id_usuario = ?',
        [idUsuario]
    );

    if (result.affectedRows === 0) {
        throw crearError(404, 'Usuario inexistente');
    }

    return { mensaje: 'Cuenta eliminada correctamente' };
}

module.exports = {
    register,
    login,
    actualizarNombre,
    eliminarCuenta,
};