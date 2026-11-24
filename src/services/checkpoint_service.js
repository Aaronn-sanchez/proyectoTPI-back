const db = require('../config/database');

const MAX_GUARDADOS = 5;

function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

// Lista liviana (sin estado_objetos) para el panel de la pausa y los banderines
async function listar(idUsuario, idNivel) {
    const [rows] = await db.execute(
        `SELECT id_checkpoint, id_nivel, nombre_slot AS nombre, pos_x, pos_y, fecha_guardado
         FROM CHECKPOINTS_ESTADO
         WHERE id_usuario = ? AND id_nivel = ? AND tipo_guardado = 'Manual_Slot'
         ORDER BY fecha_guardado DESC`,
        [idUsuario, idNivel]
    );
    return {
        guardados: rows,
        max: MAX_GUARDADOS,
        disponibles: Math.max(0, MAX_GUARDADOS - rows.length),
    };
}

// Un guardado completo, para cargarlo
async function obtener(idUsuario, idCheckpoint) {
    const [rows] = await db.execute(
        `SELECT id_checkpoint, id_nivel, nombre_slot AS nombre, pos_x, pos_y,
                estado_objetos, fecha_guardado
         FROM CHECKPOINTS_ESTADO
         WHERE id_checkpoint = ? AND id_usuario = ? AND tipo_guardado = 'Manual_Slot'`,
        [idCheckpoint, idUsuario]
    );
    if (!rows.length) throw crearError(404, 'Guardado inexistente');
    return rows[0];
}

// El más reciente del nivel (o null), para cargar al entrar
async function ultimo(idUsuario, idNivel) {
    const [rows] = await db.execute(
        `SELECT id_checkpoint, id_nivel, nombre_slot AS nombre, pos_x, pos_y,
                estado_objetos, fecha_guardado
         FROM CHECKPOINTS_ESTADO
         WHERE id_usuario = ? AND id_nivel = ? AND tipo_guardado = 'Manual_Slot'
         ORDER BY fecha_guardado DESC LIMIT 1`,
        [idUsuario, idNivel]
    );
    return { guardado: rows[0] || null };
}

async function crear(idUsuario, { id_nivel, nombre, pos_x, pos_y, estado_objetos }) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [[{ n }]] = await conn.execute(
            `SELECT COUNT(*) AS n FROM CHECKPOINTS_ESTADO
             WHERE id_usuario = ? AND id_nivel = ? AND tipo_guardado = 'Manual_Slot'
             FOR UPDATE`,
            [idUsuario, id_nivel]
        );
        if (n >= MAX_GUARDADOS) {
            throw crearError(409, 'Ya tenés 5 guardados: reescribí o borrá uno');
        }

        const [r] = await conn.execute(
            `INSERT INTO CHECKPOINTS_ESTADO
             (id_usuario, id_nivel, tipo_guardado, nombre_slot, pos_x, pos_y, estado_objetos)
             VALUES (?, ?, 'Manual_Slot', ?, ?, ?, ?)`,
            [idUsuario, id_nivel, nombre, pos_x, pos_y, JSON.stringify(estado_objetos)]
        );

        await conn.commit();
        return { id_checkpoint: r.insertId };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

// El lápiz: reemplaza TODO el guardado (nombre, posición y estado)
async function reescribir(idUsuario, idCheckpoint, { nombre, pos_x, pos_y, estado_objetos }) {
    const [r] = await db.execute(
        `UPDATE CHECKPOINTS_ESTADO
         SET nombre_slot = ?, pos_x = ?, pos_y = ?, estado_objetos = ?, fecha_guardado = NOW()
         WHERE id_checkpoint = ? AND id_usuario = ? AND tipo_guardado = 'Manual_Slot'`,
        [nombre, pos_x, pos_y, JSON.stringify(estado_objetos), idCheckpoint, idUsuario]
    );
    if (r.affectedRows === 0) throw crearError(404, 'Guardado inexistente');
    return { mensaje: 'Guardado actualizado' };
}

async function borrar(idUsuario, idCheckpoint) {
    const [r] = await db.execute(
        `DELETE FROM CHECKPOINTS_ESTADO
         WHERE id_checkpoint = ? AND id_usuario = ? AND tipo_guardado = 'Manual_Slot'`,
        [idCheckpoint, idUsuario]
    );
    if (r.affectedRows === 0) throw crearError(404, 'Guardado inexistente');
    return { mensaje: 'Guardado eliminado' };
}

module.exports = { listar, obtener, ultimo, crear, reescribir, borrar };