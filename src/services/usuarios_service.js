const db = require('../config/database');
const { obtenerRolEditable, crearError } = require('./roles_service');

const ROL_QA = Number(process.env.ROL_QA) || 2;

// Panel izquierdo: usuarios activos en orden alfabético, con sus roles configurables
async function listar() {
    const [usuarios] = await db.execute(
        `SELECT u.id_usuario, u.nombre_usuario AS nombre, u.email
         FROM USUARIOS u
         WHERE u.estado = 1
           AND NOT EXISTS (
               SELECT 1 FROM USUARIO_ROLES ur
               WHERE ur.id_usuario = u.id_usuario AND ur.id_rol = ?
           )
         ORDER BY u.nombre_usuario`,
        [ROL_QA]
    );
    const [asignados] = await db.execute(
        `SELECT ur.id_usuario, r.id_rol, r.nombre_rol
         FROM USUARIO_ROLES ur JOIN ROLES r ON r.id_rol = ur.id_rol
         WHERE r.es_sistema = 0`
    );
    return usuarios.map((u) => ({
        ...u,
        roles: asignados
            .filter((a) => a.id_usuario === u.id_usuario)
            .map(({ id_rol, nombre_rol }) => ({ id_rol, nombre_rol })),
    }));
}

async function validarUsuario(idUsuario) {
    const [rows] = await db.execute(
        `SELECT 1 FROM USUARIOS u
         WHERE u.id_usuario = ? AND u.estado = 1
           AND NOT EXISTS (
               SELECT 1 FROM USUARIO_ROLES ur
               WHERE ur.id_usuario = u.id_usuario AND ur.id_rol = ?
           )`,
        [idUsuario, ROL_QA]
    );
    if (!rows.length) throw crearError(404, 'Usuario inexistente');
}

async function listarRoles(idUsuario) {
    await validarUsuario(idUsuario);
    const [rows] = await db.execute(
        `SELECT r.id_rol, r.nombre_rol
         FROM USUARIO_ROLES ur JOIN ROLES r ON r.id_rol = ur.id_rol
         WHERE ur.id_usuario = ? AND r.es_sistema = 0
         ORDER BY r.id_rol`,
        [idUsuario]
    );
    return { roles: rows };
}

async function asignarRol(idUsuario, idRol) {
    await validarUsuario(idUsuario);
    await obtenerRolEditable(db, idRol);
    await db.execute(
        `INSERT INTO USUARIO_ROLES (id_usuario, id_rol) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE id_rol = id_rol`,
        [idUsuario, idRol]
    );
    return listarRoles(idUsuario);
}

// Descartar el rol de ESTE usuario, sin borrar el rol
async function quitarRol(idUsuario, idRol) {
    await validarUsuario(idUsuario);
    await obtenerRolEditable(db, idRol);
    const [r] = await db.execute(
        'DELETE FROM USUARIO_ROLES WHERE id_usuario = ? AND id_rol = ?',
        [idUsuario, idRol]
    );
    if (r.affectedRows === 0) throw crearError(404, 'El usuario no tiene ese rol');
    return listarRoles(idUsuario);
}

async function deshabilitar(idUsuario) {
    await validarUsuario(idUsuario);
    const [r] = await db.execute(
        'UPDATE USUARIOS SET estado = 0 WHERE id_usuario = ?',
        [idUsuario]
    );
    if (r.affectedRows === 0) throw crearError(404, 'Usuario inexistente');
    return { mensaje: 'Cuenta deshabilitada' };
}

module.exports = { listar, listarRoles, asignarRol, quitarRol, deshabilitar };