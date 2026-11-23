const db = require('../config/database');

// Claves de todos los servicios que tiene el usuario, según sus roles
async function obtenerServicios(idUsuario) {
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