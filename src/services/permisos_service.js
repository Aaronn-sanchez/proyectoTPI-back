
require('dotenv').config();

const db = require('../config/database');
const ROL_QA = Number(process.env.ROL_QA) || 2;

// Claves de todos los servicios que tiene el usuario, según sus roles
async function obtenerServicios(idUsuario) {

    // Comprobamos si el usuario tiene el rol QA
    const [rolesQA] = await db.execute(
        `SELECT id_rol
         FROM USUARIO_ROLES
         WHERE id_usuario = ? AND id_rol = ?
         LIMIT 1`,
        [idUsuario, ROL_QA]
    );

    // QA tiene acceso a todos los servicios
    if (rolesQA.length > 0) {
        const [rows] = await db.execute(
            'SELECT clave FROM SERVICIOS'
        );

        return rows.map((r) => r.clave);
    }

    // Los demás usuarios obtienen los servicios de sus roles
    const [rows] = await db.execute(
        `SELECT DISTINCT s.clave
         FROM USUARIO_ROLES ur
         JOIN ROL_SERVICIOS rs ON rs.id_rol = ur.id_rol
         JOIN SERVICIOS s ON s.id_servicio = rs.id_servicio
         WHERE ur.id_usuario = ?`,
        [idUsuario]
    );

    return rows.map((r) => r.clave);
}

async function tieneServicio(idUsuario, clave) {
    const servicios = await obtenerServicios(idUsuario);
    return servicios.includes(clave);
}

module.exports = { obtenerServicios, tieneServicio };
