const db = require('../config/database');

function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}



// LA VISTA: todos los logros con el progreso de este jugador
async function listar(idUsuario) {
    const [rows] = await db.execute(
        `SELECT c.id_logro, c.codigo, c.titulo_logro AS titulo, c.descripcion, c.meta,
                COALESCE(ul.progreso, 0) AS progreso,
                ul.fecha_desbloqueo
         FROM CATALOGO_LOGROS c
         LEFT JOIN USUARIO_LOGROS ul
                ON ul.id_logro = c.id_logro AND ul.id_usuario = ?
         ORDER BY c.id_logro`,
        [idUsuario]
    );

    return rows.map((r) => ({
        ...r,
        desbloqueado: r.fecha_desbloqueo !== null,
    }));
}

// EL JUEGO AVISA: suma progreso y desbloquea si llega a la meta
async function registrarProgreso(idUsuario, codigo, incremento) {
    const [logros] = await db.execute(
        'SELECT id_logro, titulo_logro, meta FROM CATALOGO_LOGROS WHERE codigo = ?',
        [codigo]
    );
    if (!logros.length) {
        throw crearError(404, 'Logro inexistente');
    }
    const { id_logro: idLogro, titulo_logro: titulo, meta } = logros[0];

    const [filas] = await db.execute(
        `SELECT progreso, fecha_desbloqueo FROM USUARIO_LOGROS
         WHERE id_usuario = ? AND id_logro = ?`,
        [idUsuario, idLogro]
    );
    const actual = filas[0];

    // Ya desbloqueado: no se hace nada
    if (actual && actual.fecha_desbloqueo) {
        return { logro: titulo, progreso: meta, meta, desbloqueado: true, nuevo: false };
    }

    const progreso = Math.min((actual ? actual.progreso : 0) + incremento, meta);
    const desbloquea = progreso >= meta;

    await db.execute(
        `INSERT INTO USUARIO_LOGROS (id_usuario, id_logro, progreso, fecha_desbloqueo)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            progreso = VALUES(progreso),
            fecha_desbloqueo = VALUES(fecha_desbloqueo)`,
        [idUsuario, idLogro, progreso, desbloquea ? new Date() : null]
    );

    return { logro: titulo, progreso, meta, desbloqueado: desbloquea, nuevo: desbloquea };
}

module.exports = { listar, registrarProgreso };