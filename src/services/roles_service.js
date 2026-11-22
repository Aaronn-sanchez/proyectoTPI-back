const db = require('../config/database');

function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

// Devuelve el rol si existe y NO es de sistema (exec = db o una conexión de transacción)
async function obtenerRolEditable(exec, idRol) {
    const [rows] = await exec.execute(
        'SELECT id_rol, nombre_rol, es_sistema FROM ROLES WHERE id_rol = ?',
        [idRol]
    );
    if (!rows.length) throw crearError(404, 'Rol inexistente');
    if (rows[0].es_sistema) throw crearError(403, 'Los roles de sistema no se pueden modificar');
    return rows[0];
}

async function validarServicios(exec, ids) {
    if (!ids.length) return;
    const marcas = ids.map(() => '?').join(',');
    const [rows] = await exec.execute(
        `SELECT COUNT(*) AS n FROM SERVICIOS WHERE id_servicio IN (${marcas})`,
        ids
    );
    if (rows[0].n !== ids.length) throw crearError(400, 'Algún servicio no existe');
}

async function validarUsuarios(exec, ids) {
    if (!ids.length) return;
    const marcas = ids.map(() => '?').join(',');
    const [rows] = await exec.execute(
        `SELECT COUNT(*) AS n FROM USUARIOS WHERE estado = 1 AND id_usuario IN (${marcas})`,
        ids
    );
    if (rows[0].n !== ids.length) throw crearError(400, 'Algún usuario no existe');
}

async function conTransaccion(trabajo) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const resultado = await trabajo(conn);
        await conn.commit();
        return resultado;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

// Catálogo para armar los checkboxes del panel
async function listarServicios() {
    const [rows] = await db.execute(
        'SELECT id_servicio, clave, descripcion FROM SERVICIOS ORDER BY id_servicio'
    );
    return rows;
}

// Roles configurables (sin los de sistema), cada uno con los ids de sus servicios
async function listar() {
    const [roles] = await db.execute(
        'SELECT id_rol, nombre_rol FROM ROLES WHERE es_sistema = 0 ORDER BY id_rol'
    );
    const [permisos] = await db.execute(
        `SELECT rs.id_rol, rs.id_servicio
         FROM ROL_SERVICIOS rs JOIN ROLES r ON r.id_rol = rs.id_rol
         WHERE r.es_sistema = 0`
    );
    return roles.map((r) => ({
        ...r,
        servicios: permisos.filter((p) => p.id_rol === r.id_rol).map((p) => p.id_servicio),
    }));
}

// Un rol con sus servicios y los usuarios que lo tienen (para pintarlos en violeta)
async function obtener(idRol) {
    const rol = await obtenerRolEditable(db, idRol);
    const [servicios] = await db.execute(
        'SELECT id_servicio FROM ROL_SERVICIOS WHERE id_rol = ?', [idRol]
    );
    const [usuarios] = await db.execute(
        `SELECT u.id_usuario FROM USUARIO_ROLES ur
         JOIN USUARIOS u ON u.id_usuario = ur.id_usuario
         WHERE ur.id_rol = ? AND u.estado = 1`,
        [idRol]
    );
    return {
        id_rol: rol.id_rol,
        nombre_rol: rol.nombre_rol,
        servicios: servicios.map((s) => s.id_servicio),
        usuarios: usuarios.map((u) => u.id_usuario),
    };
}

// "Crea un nuevo Rol": nombre + usuarios elegidos (+ servicios opcionales)
async function crear(nombre, servicios, usuarios) {
    const idsServ = [...new Set(servicios)];
    const idsUsu = [...new Set(usuarios)];

    const idRol = await conTransaccion(async (conn) => {
        await validarServicios(conn, idsServ);
        await validarUsuarios(conn, idsUsu);

        let resultado;
        try {
            [resultado] = await conn.execute(
                'INSERT INTO ROLES (nombre_rol, es_sistema) VALUES (?, 0)', [nombre]
            );
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw crearError(409, 'Ya existe un rol con ese nombre');
            throw error;
        }

        for (const s of idsServ) {
            await conn.execute('INSERT INTO ROL_SERVICIOS (id_rol, id_servicio) VALUES (?, ?)', [resultado.insertId, s]);
        }
        for (const u of idsUsu) {
            await conn.execute('INSERT INTO USUARIO_ROLES (id_usuario, id_rol) VALUES (?, ?)', [u, resultado.insertId]);
        }
        return resultado.insertId;
    });

    return obtener(idRol);
}

async function renombrar(idRol, nombre) {
    await obtenerRolEditable(db, idRol);
    try {
        await db.execute('UPDATE ROLES SET nombre_rol = ? WHERE id_rol = ?', [nombre, idRol]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') throw crearError(409, 'Ya existe un rol con ese nombre');
        throw error;
    }
    return obtener(idRol);
}

// La X del rol: se lo quita a todos los usuarios y lo borra (ROL_SERVICIOS cae por CASCADE)
async function borrar(idRol) {
    await conTransaccion(async (conn) => {
        await obtenerRolEditable(conn, idRol);
        await conn.execute('DELETE FROM USUARIO_ROLES WHERE id_rol = ?', [idRol]);
        await conn.execute('DELETE FROM ROLES WHERE id_rol = ?', [idRol]);
    });
    return { mensaje: 'Rol eliminado' };
}

// Checkboxes: reemplaza TODA la lista de servicios del rol
async function reemplazarServicios(idRol, servicios) {
    const ids = [...new Set(servicios)];
    await conTransaccion(async (conn) => {
        await obtenerRolEditable(conn, idRol);
        await validarServicios(conn, ids);
        await conn.execute('DELETE FROM ROL_SERVICIOS WHERE id_rol = ?', [idRol]);
        for (const s of ids) {
            await conn.execute('INSERT INTO ROL_SERVICIOS (id_rol, id_servicio) VALUES (?, ?)', [idRol, s]);
        }
    });
    return obtener(idRol);
}

async function agregarServicio(idRol, idServicio) {
    await obtenerRolEditable(db, idRol);
    await validarServicios(db, [idServicio]);
    await db.execute(
        `INSERT INTO ROL_SERVICIOS (id_rol, id_servicio) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE id_rol = id_rol`,
        [idRol, idServicio]
    );
    return obtener(idRol);
}

async function quitarServicio(idRol, idServicio) {
    await obtenerRolEditable(db, idRol);
    const [r] = await db.execute(
        'DELETE FROM ROL_SERVICIOS WHERE id_rol = ? AND id_servicio = ?', [idRol, idServicio]
    );
    if (r.affectedRows === 0) throw crearError(404, 'El rol no tiene ese servicio');
    return obtener(idRol);
}

module.exports = {
    listarServicios, listar, obtener, crear, renombrar, borrar,
    reemplazarServicios, agregarServicio, quitarServicio,
    obtenerRolEditable, crearError,
};